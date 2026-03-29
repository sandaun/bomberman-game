class GameController {
  constructor(config) {
    this.canvas = config.canvas;
    this.ctx = config.ctx;
    this.columns = config.columns;
    this.rows = config.rows;
    this.cellSize = config.cellSize;
    this.assetStore = config.assetStore;
    this.hud = config.hud;
    this.input = config.input;

    this.renderer = new Renderer({
      ctx: this.ctx,
      assetStore: this.assetStore,
      cellSize: this.cellSize,
      columns: this.columns,
      rows: this.rows,
    });

    this.player = new PlayerController({ cellSize: this.cellSize });
    this.bombSystem = new BombSystem();
    this.enemies = [];
    this.level = null;
    this.levelNumber = 1;
    this.score = 0;
    this.state = GAME_STATES.START;
    this.lastFrameTime = 0;
    this.animationFrameId = null;

    this.input.onPlaceBomb = () => this.placeBomb();
    this.input.onPause = () => this.togglePause();
    this.loop = this.loop.bind(this);
  }

  boot() {
    this.input.attach();
    this.hud.showStartScreen();
    this.renderFrame(performance.now());
  }

  startNewGame() {
    this.score = 0;
    this.levelNumber = 1;
    this.player.resetForNewGame();
    this.startLevel();
    this.hud.showGameScreen();
  }

  restartRun() {
    this.score = 0;
    this.levelNumber = 1;
    this.player.resetForNewGame();
    this.startLevel();
  }

  nextLevel() {
    this.levelNumber += 1;
    this.startLevel();
  }

  startLevel() {
    this.level = new LevelState({
      columns: this.columns,
      rows: this.rows,
      levelNumber: this.levelNumber,
    });

    this.player.prepareForLevel({ row: 1, col: 1 });
    this.bombSystem.reset();
    this.enemies = this.level
      .getEnemySpawnTiles(Math.min(2 + this.levelNumber - 1, 6))
      .map(
        (spawnTile) =>
          new EnemyController({
            spawnTile,
            cellSize: this.cellSize,
            levelNumber: this.levelNumber,
            baseSpeed: 165,
          })
      );

    this.state = GAME_STATES.PLAYING;
    this.lastFrameTime = performance.now();
    this.input.clear();
    this.hud.hideOverlay();

    if (!this.animationFrameId) {
      this.animationFrameId = window.requestAnimationFrame(this.loop);
    }
  }

  togglePause() {
    if (this.state === GAME_STATES.START) {
      return;
    }

    if (this.state === GAME_STATES.PLAYING) {
      this.state = GAME_STATES.PAUSED;
      this.hud.showOverlay({
        title: 'Paused',
        message: 'Catch your breath, then jump back into the maze.',
        primaryLabel: 'Resume',
        onPrimary: () => {
          this.state = GAME_STATES.PLAYING;
          this.hud.hideOverlay();
        },
        secondaryLabel: 'Restart run',
        onSecondary: () => this.restartRun(),
      });
      return;
    }

    if (this.state === GAME_STATES.PAUSED) {
      this.state = GAME_STATES.PLAYING;
      this.hud.hideOverlay();
    }
  }

  placeBomb() {
    if (this.state !== GAME_STATES.PLAYING) {
      return;
    }

    this.bombSystem.placeBomb(this.player);
  }

  loop(timestamp) {
    const deltaTime = Math.min((timestamp - this.lastFrameTime) / 1000, 0.05);
    this.lastFrameTime = timestamp;

    if (this.state === GAME_STATES.PLAYING) {
      this.update(deltaTime);
    }

    this.renderFrame(timestamp);
    this.animationFrameId = window.requestAnimationFrame(this.loop);
  }

  update(deltaTime) {
    const directionIntent = this.input.getDirectionIntent();
    if (directionIntent) {
      this.player.tryMove(directionIntent, this.level, this.bombSystem);
    }

    this.player.update(deltaTime);
    this.enemies.forEach((enemy) => enemy.update(deltaTime, this.level, this.bombSystem));

    const events = this.bombSystem.update(deltaTime, this.level, this.player, this.enemies);
    this.handleBombEvents(events);
    this.handleCollectibles();
    this.resolveEnemyContact();
    this.cleanupEnemies();
    this.tryOpenDoor();
    this.checkWinCondition();
  }

  handleBombEvents(events) {
    events.forEach((event) => {
      if (event.type === 'breakable-destroyed') {
        this.score += 100;
      }

      if (event.type === 'enemy-hit') {
        this.score += 500;
      }

      if (event.type === 'player-hit') {
        this.handlePlayerDeath();
      }
    });
  }

  handleCollectibles() {
    const collected = this.level.collectPowerup(
      this.player.gridPosition.row,
      this.player.gridPosition.col
    );

    if (collected === HIDDEN_CONTENT.POWERUP_BOMB) {
      this.player.addBombCapacity();
      this.score += 250;
    }

    if (collected === HIDDEN_CONTENT.POWERUP_RANGE) {
      this.player.addRange();
      this.score += 250;
    }
  }

  resolveEnemyContact() {
    const enemyCollision = this.enemies.some(
      (enemy) =>
        (enemy.state === ENTITY_STATES.IDLE ||
          enemy.state === ENTITY_STATES.WALKING) &&
        enemy.gridPosition.row === this.player.gridPosition.row &&
        enemy.gridPosition.col === this.player.gridPosition.col
    );

    if (enemyCollision) {
      this.handlePlayerDeath();
    }
  }

  cleanupEnemies() {
    this.enemies = this.enemies.filter((enemy) => enemy.state !== ENTITY_STATES.DEAD);
  }

  tryOpenDoor() {
    if (!this.enemies.length) {
      this.level.openDoor();
    }
  }

  checkWinCondition() {
    const tile = this.level.getTile(
      this.player.gridPosition.row,
      this.player.gridPosition.col
    );

    if (!tile || tile.type !== TILE_TYPES.DOOR_OPEN) {
      return;
    }

    this.state = GAME_STATES.WON;
    this.score += 1000;
    this.hud.showOverlay({
      title: `Level ${this.levelNumber} Clear`,
      message: 'The exit is open. Push deeper and let the maze hit harder.',
      primaryLabel: 'Next level',
      onPrimary: () => this.nextLevel(),
      secondaryLabel: 'Restart run',
      onSecondary: () => this.restartRun(),
    });
  }

  handlePlayerDeath() {
    if (this.state !== GAME_STATES.PLAYING || !this.player.canAct()) {
      return;
    }

    this.player.kill();
    this.state = GAME_STATES.LOST;
    this.hud.showOverlay({
      title: 'You were caught',
      message: 'Bombs, enemies, and tighter lanes are all active now. One more try?',
      primaryLabel: 'Restart run',
      onPrimary: () => this.restartRun(),
      secondaryLabel: 'Back to title',
      onSecondary: () => {
        this.state = GAME_STATES.START;
        this.input.clear();
        this.hud.showStartScreen();
      },
    });
  }

  renderFrame(timestamp) {
    if (!this.level) {
      this.ctx.fillStyle = '#102027';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      return;
    }

    this.renderer.render({
      level: this.level,
      player: this.player,
      enemies: this.enemies,
      bombSystem: this.bombSystem,
      time: timestamp,
    });

    this.hud.update({
      score: this.score,
      level: this.levelNumber,
      bombsPlaced: this.player.activeBombs,
      maxBombs: this.player.maxBombs,
      range: this.player.bombRange,
      enemies: this.enemies.length,
      status: this.getStatusLabel(),
      state: this.state,
    });
  }

  getStatusLabel() {
    if (this.state === GAME_STATES.PAUSED) {
      return 'Paused';
    }

    if (this.state === GAME_STATES.WON) {
      return 'Exit reached';
    }

    if (this.state === GAME_STATES.LOST) {
      return 'Run over';
    }

    if (!this.enemies.length) {
      return this.level.doorOpen ? 'Exit open' : 'Find the hidden door';
    }

    return 'Clear enemies and break crates';
  }
}

window.GameController = GameController;
