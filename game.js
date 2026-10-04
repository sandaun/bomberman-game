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
    this.sounds = config.sounds || null;

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
    this.feedback = [];
    this.level = null;
    this.levelNumber = 1;
    this.score = 0;
    this.continuesRemaining = 3;
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
    this.sounds?.unlock();
    this.score = 0;
    this.continuesRemaining = 3;
    this.levelNumber = 1;
    this.player.resetForNewGame();
    this.startLevel();
    this.hud.showGameScreen();
  }

  restartRun() {
    this.score = 0;
    this.continuesRemaining = 3;
    this.levelNumber = 1;
    this.player.resetForNewGame();
    this.startLevel();
  }

  nextLevel() {
    this.levelNumber += 1;
    this.startLevel();
  }

  startLevel() {
    this.sounds?.stop();
    this.level = new LevelState({
      columns: this.columns,
      rows: this.rows,
      levelNumber: this.levelNumber,
    });

    this.player.prepareForLevel({ row: 1, col: 1 });
    this.bombSystem.reset();
    this.feedback = [];
    const lineup = getEnemyLineup(this.levelNumber);
    this.enemies = this.level
      .getEnemySpawnTiles(lineup.length)
      .map(
        (spawnTile, index) =>
          new EnemyController({
            spawnTile,
            cellSize: this.cellSize,
            levelNumber: this.levelNumber,
            species: lineup[index],
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
      this.input.clear();
      this.sounds?.stop();
      this.state = GAME_STATES.PAUSED;
      this.hud.showOverlay({
        title: 'Paused',
        message: 'Catch your breath, then jump back into the maze.',
        primaryLabel: 'Resume',
        onPrimary: () => {
          this.input.clear();
          this.state = GAME_STATES.PLAYING;
          this.hud.hideOverlay();
        },
        secondaryLabel: 'Restart run',
        onSecondary: () => this.restartRun(),
      });
      return;
    }

    if (this.state === GAME_STATES.PAUSED) {
      this.input.clear();
      this.state = GAME_STATES.PLAYING;
      this.hud.hideOverlay();
    }
  }

  placeBomb() {
    if (this.state !== GAME_STATES.PLAYING) {
      return;
    }

    this.sounds?.unlock();
    if (this.bombSystem.placeBomb(this.player)) {
      this.sounds?.play('place');
    }
  }

  loop(timestamp) {
    const deltaTime = Math.min((timestamp - this.lastFrameTime) / 1000, 0.05);
    this.lastFrameTime = timestamp;

    if (this.state === GAME_STATES.PLAYING) {
      this.update(deltaTime);
    } else if (
      this.state === GAME_STATES.LOST &&
      this.player.state === ENTITY_STATES.DYING
    ) {
      this.updateDeathFeedback(deltaTime);
    }

    this.renderFrame(timestamp);
    this.animationFrameId = window.requestAnimationFrame(this.loop);
  }

  update(deltaTime) {
    this.updateFeedback(deltaTime);
    this.updatePlayerMovement(deltaTime);
    this.enemies.forEach((enemy) =>
      enemy.update(deltaTime, this.level, this.bombSystem, this.player)
    );

    const events = this.bombSystem.update(deltaTime, this.level, this.player, this.enemies);
    this.handleBombEvents(events);
    if (!this.player.canAct()) {
      this.cleanupEnemies();
      return;
    }
    this.handleCollectibles();
    this.resolveEnemyContact();
    this.cleanupEnemies();
    if (!this.player.canAct()) {
      return;
    }
    this.tryOpenDoor();
    this.checkWinCondition();
  }

  updatePlayerMovement(deltaTime) {
    let remainingTime = deltaTime;

    while (remainingTime > 0) {
      if (!this.player.isMoving() && this.player.canAct()) {
        for (const direction of this.input.getMovementDirections()) {
          if (this.player.tryMove(direction, this.level, this.bombSystem)) {
            this.input.consumeDirection(direction);
            break;
          }
        }
      }

      if (!this.player.isMoving()) {
        this.player.update(remainingTime);
        this.input.update(remainingTime);
        break;
      }

      // Carry unused frame time across intersections to keep movement smooth.
      const timeToArrival =
        ((1 - this.player.travelProgress) * this.player.cellSize) /
        this.player.moveSpeed;
      const step = Math.min(remainingTime, timeToArrival);
      this.player.update(step);
      this.input.update(step);
      remainingTime -= step;
    }
  }

  addFeedback(type, position, duration, label = '', color = '#ffd166') {
    this.feedback.push({ type, ...position, timer: duration, duration, label, color });
  }

  updateFeedback(deltaTime) {
    this.feedback.forEach((effect) => {
      effect.timer = Math.max(0, effect.timer - deltaTime);
    });
    this.feedback = this.feedback.filter((effect) => effect.timer > 0);
  }

  updateDeathFeedback(deltaTime) {
    this.player.update(deltaTime);
    this.enemies.forEach((enemy) => {
      if (enemy.state === ENTITY_STATES.DYING) {
        enemy.update(deltaTime, this.level, this.bombSystem, this.player);
      }
    });
    this.bombSystem.updateExplosions(deltaTime);
    this.updateFeedback(deltaTime);
    this.cleanupEnemies();
    if (this.player.state === ENTITY_STATES.DEAD) {
      this.showGameOver();
    }
  }

  handleBombEvents(events) {
    if (events.some((event) => event.type === 'bomb-exploded')) {
      this.sounds?.play('explosion');
    }
    events.forEach((event) => {
      if (event.type === 'breakable-destroyed') {
        this.score += 100;
        this.addFeedback(
          'breakable',
          { x: event.col * this.cellSize, y: event.row * this.cellSize },
          0.4
        );
      }

      if (event.type === 'enemy-hit') {
        this.score += event.score;
        this.addFeedback('reward', event.position, 0.65, `+${event.score}`);
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

    if (collected) {
      this.sounds?.play('pickup');
    }

    if (collected === HIDDEN_CONTENT.POWERUP_BOMB) {
      this.player.addBombCapacity();
      this.score += 250;
      this.addFeedback('reward', this.player.renderPosition, 0.7, '+1 BOMB');
    }

    if (collected === HIDDEN_CONTENT.POWERUP_RANGE) {
      this.player.addRange();
      this.score += 250;
      this.addFeedback('reward', this.player.renderPosition, 0.7, '+1 RANGE', '#ff6b6b');
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

    this.input.clear();
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

    this.input.clear();
    this.player.kill();
    this.state = GAME_STATES.LOST;
  }

  continueRun() {
    if (
      this.state !== GAME_STATES.LOST ||
      this.player.state !== ENTITY_STATES.DEAD ||
      this.continuesRemaining === 0
    ) {
      return;
    }

    this.continuesRemaining -= 1;
    this.startLevel();
  }

  showGameOver() {
    if (this.continuesRemaining > 0) {
      this.hud.showOverlay({
        title: 'Continue?',
        message: `${this.continuesRemaining} continues left. Retry level ${this.levelNumber} with your score and upgrades.`,
        primaryLabel: 'Continue',
        onPrimary: () => this.continueRun(),
        secondaryLabel: 'Restart run',
        onSecondary: () => this.restartRun(),
      });
      return;
    }

    this.hud.showOverlay({
      title: 'Game over',
      message: 'No continues left. Start a new run to try again.',
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
      feedback: this.feedback,
      time: timestamp,
    });

    this.hud.update({
      score: this.score,
      continues: this.continuesRemaining,
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
      return this.player.state === ENTITY_STATES.DYING
        ? 'You were hit'
        : this.continuesRemaining > 0 ? 'Continue available' : 'Run over';
    }

    if (!this.enemies.length) {
      return this.level.doorOpen ? 'Exit open' : 'Find the hidden door';
    }

    return [...new Set(this.enemies.map((enemy) => enemy.definition.name))].join(' · ');
  }
}

window.GameController = GameController;
