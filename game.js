class Game {
  constructor(options) {
    this.player = new Player(options.columns, options.rows, options.widthCell);
    this.grid = new Grid(options.columns, options.rows, options.widthCell);
    this.enemy = new Enemy(options.columns, options.rows, options.widthCell);
    this.enemies = [];
    this.fixObstacle = undefined; // Not used at the moment, maybe in Grid class
    this.rows = options.rows;
    this.columns = options.columns;
    this.widthCell = options.widthCell;
    this.ctx = options.ctx;
    this.intervalGame = undefined;
    this.points = 0;
    this.quantityEnemies = 2;
    this.gameBegins = true;
    this.createEnemies();
    this.bombSpriteGridJ = 0;
    this.bombSpriteGridI = 0;
    this.bombSpriteInterval();
  }

  // --------------- DRAW BOARD FUNCTIONS ----------------
  drawBoard() {
    this.ctx.fillStyle = '#41ae41';
    this.ctx.fillRect(
      0,
      0,
      this.columns * this.widthCell,
      this.rows * this.widthCell
    );
  }

  drawBoardElements() {
    let brick = new Image();
    brick.src = 'images/brick.png';
    let brickbreak = new Image();
    brickbreak.src = 'images/brickbreak.png';
    let bomb = new Image();
    bomb.src = 'images/bombV2.png';
    let door = new Image();
    door.src = 'images/door.png';

    for (let i = 0; i < this.grid.gameGrid.length; i++) {
      for (let j = 0; j < this.grid.gameGrid[i].length; j++) {
        if (this.grid.gameGrid[i][j] === this.grid.gridElements.brick) {
          this.ctx.drawImage(
            brick,
            j * this.widthCell,
            i * this.widthCell,
            this.widthCell,
            this.widthCell
          );
        }
        if (this.grid.gameGrid[i][j] === this.grid.gridElements.key) {
          this.ctx.drawImage(
            door,
            j * this.widthCell,
            i * this.widthCell,
            this.widthCell,
            this.widthCell
          );
        }
        if (
          this.grid.gameGrid[i][j] === this.grid.gridElements.breakableBrick
        ) {
          this.ctx.drawImage(
            brickbreak,
            j * this.widthCell,
            i * this.widthCell,
            this.widthCell,
            this.widthCell
          );
        }
        if (this.grid.gameGrid[i][j] === this.grid.gridElements.bomb) {
          this.bombSpriteGridJ = j;
          this.bombSpriteGridI = i;
          this.ctx.drawImage(
            this.player.bombSprite,
            this.player.bombSrcX,
            this.player.bombSrcY,
            this.player.bombWidthFrame,
            this.player.bombHeightFrame,
            j * this.widthCell,
            i * this.widthCell,
            this.player.bombWidthFrame,
            this.player.bombHeightFrame
          );
          // this.ctx.drawImage(bomb, j * this.widthCell, i * this.widthCell, this.widthCell, this.widthCell);
        }
      }
    }
  }

  bombSpriteInterval() {
    this.bombInterval = setInterval(
      function () {
        this.player.updateBombFrame(
          this.ctx,
          this.bombSpriteGridJ * this.widthCell,
          this.bombSpriteGridI * this.widthCell
        );
      }.bind(this),
      150
    );
  }

  // ----------------- CHECK COLLISIONS ------------------
  checkCollision(x, y) {
    let x1 = Math.floor(x + 1 / this.widthCell),
      y1 = Math.floor(y + 1 / this.widthCell),
      x2 = Math.floor(x + 1 - 1 / this.widthCell),
      y2 = Math.floor(y + 1 - 1 / this.widthCell);

    if (this.checkTileContent(y1, x1, y2, x2, this.grid.gridElements.key)) {
      // You win on this case!
      this.pause();
      this.onWinGame();
    } else if (
      this.checkTileContent(y1, x1, y2, x2, this.grid.gridElements.empty)
    ) {
      return true; // Collision
    }
    return false;
  }

  checkTileContent(y1, x1, y2, x2, content) {
    if (content === this.grid.gridElements.empty) {
      return (
        this.grid.gameGrid[y1][x1] !== content ||
        this.grid.gameGrid[y2][x1] !== content ||
        this.grid.gameGrid[y1][x2] !== content ||
        this.grid.gameGrid[y2][x2] !== content
      );
    }
    return (
      this.grid.gameGrid[y1][x1] === content ||
      this.grid.gameGrid[y2][x1] === content ||
      this.grid.gameGrid[y1][x2] === content ||
      this.grid.gameGrid[y2][x2] === content
    );
  }

  assignControlsToKeys() {
    let isShiftPressed = false; // Estat de Shift

    document.onkeydown = (e) => {
      if (e.keyCode === 16) {
        // Shift
        isShiftPressed = true;
        return;
      }

      switch (e.keyCode) {
        case 87: // W
        case 38: // Fletxa amunt
          this.handleDirectionChange('up', isShiftPressed);
          break;
        case 83: // S
        case 40: // Fletxa avall
          this.handleDirectionChange('down', isShiftPressed);
          break;
        case 65: // A
        case 37: // Fletxa esquerra
          this.handleDirectionChange('left', isShiftPressed);
          break;
        case 68: // D
        case 39: // Fletxa dreta
          this.handleDirectionChange('right', isShiftPressed);
          break;
        case 32: // Barra espaiadora
          this.throwTheBomb(); // Llança la bomba
          break;
        case 80: // P per pausar
          this.pause();
          break;
      }
    };

    document.onkeyup = (e) => {
      if (e.keyCode === 16) {
        // Shift
        isShiftPressed = false;
      }

      if ([87, 38, 83, 40, 65, 37, 68, 39].includes(e.keyCode)) {
        this.player.isMoving = false; // Atura el moviment si no premem cap altra tecla
      }
    };
  }

  handleDirectionChange(direction, isShiftPressed) {
    this.player.direction = direction; // Actualitza la direcció del jugador

    if (!isShiftPressed) {
      // Només mou el jugador si Shift no està premut
      this.player.isMoving = true;

      if (!this.checkCollisionInDirection(direction)) {
        this.player.moveDirection();
      }
    }
  }

  checkCollisionInDirection(direction) {
    switch (direction) {
      case 'up':
        return this.checkCollision(
          this.player.positionX / this.widthCell,
          (this.player.positionY - 10) / this.widthCell
        );
      case 'down':
        return this.checkCollision(
          this.player.positionX / this.widthCell,
          (this.player.positionY + 10) / this.widthCell
        );
      case 'left':
        return this.checkCollision(
          (this.player.positionX - 10) / this.widthCell,
          this.player.positionY / this.widthCell
        );
      case 'right':
        return this.checkCollision(
          (this.player.positionX + 10) / this.widthCell,
          this.player.positionY / this.widthCell
        );
    }
  }

  // ----------------------------- THROWING THE BOMB FUNCTIONS ----------------------------------
  throwTheBomb() {
    let bombGridPosition = this.player.throwBomb();
    let buildBomb = this.grid.buildBomb(bombGridPosition);
    if (buildBomb === true) {
      let timeoutId = setTimeout(
        function () {
          this.grid.destroyElements(bombGridPosition, this.player.bombRange);
          this.isPlayerHit(bombGridPosition);
          this.isEnemyHit(bombGridPosition);
        }.bind(this),
        3000
      );
    }
  }

  isPlayerHit(bombGridPosition) {
    if (this.player.bombVsPlayerPosition(bombGridPosition)) {
      let timeoutId = setTimeout(
        function () {
          // This timeout is to give the bomb time to destroy the elements before stopping the game.
          this.pause();
          this.onGameOver();
        }.bind(this),
        500
      );
      return true;
    }
  }

  isEnemyHit(bombGridPosition) {
    this.enemies.forEach((enemy, index) => {
      if (enemy.bombVsEnemyPosition(bombGridPosition)) {
        this.points += 1000;
        this.enemies.splice(index, 1);
      }
    });
  }

  // ------------------------------ ENEMY FUNCTIONS ----------------------------------
  drawEnemy() {
    this.enemies.forEach((enemy) => {
      enemy.drawEnemy(this.ctx);
    });
  }

  // COLLISION BETWEEN PLAYER AND ENEMY
  enemyMeetPlayer() {
    this.enemies.forEach((enemy) => {
      let playerLeft = this.player.positionX;
      let playerRight = this.player.positionX + this.widthCell;
      let playerUp = this.player.positionY;
      let playerDown = this.player.positionY + this.widthCell;
      let enemyLeft = enemy.positionX;
      let enemyRight = enemy.positionX + this.widthCell;
      let enemyUp = enemy.positionY;
      let enemyDown = enemy.positionY + this.widthCell;

      if (
        playerRight > enemyLeft &&
        playerLeft < enemyRight &&
        playerDown > enemyUp &&
        playerUp < enemyDown
      ) {
        this.player.playerIsHit = true;
      }
    });
    return this.player.playerIsHit;
  }

  createEnemies() {
    if (this.gameBegins === true) {
      for (let i = 0; i < this.quantityEnemies; i++) {
        this.enemies.push(new Enemy(this.columns, this.rows, this.widthCell));
      }
      this.gameBegins = false;
    } else {
      this.enemies.push(new Enemy(this.columns, this.rows, this.widthCell));
    }
  }

  startCreatingEnemies() {
    this.createEnemiesInterval = setInterval(
      this.createEnemies.bind(this),
      30000
    );
  }

  startMoveEnemies() {
    this.enemies.forEach((enemy) => {
      enemy.move(this.grid);
    });
  }

  // ------------------------ POINTS -------------------------
  addScore() {
    let bomberScore = document.getElementById('points');
    let totalPoints = this.points + this.grid.points;
    bomberScore.innerHTML = totalPoints;
    return bomberScore;
  }

  // ----------------- INITIALIZING GAME AND UPDATING CANVAS ------------------

  start() {
    this.assignControlsToKeys();
    this.startCreatingEnemies();
    this.update();
    this.intervalGame = window.requestAnimationFrame(this.update.bind(this));
  }

  clear() {
    this.ctx.clearRect(
      0,
      0,
      this.columns * this.widthCell,
      this.rows * this.widthCell
    );
  }

  pause() {
    if (this.intervalGame) {
      // Pausa el moviment i l'animació de tots els enemics
      this.enemies.forEach((enemy) => {
        enemy.stop();
      });

      clearInterval(this.createEnemiesInterval);
      clearInterval(this.bombInterval);
      window.cancelAnimationFrame(this.intervalGame);
      this.intervalGame = undefined;
    } else {
      // Reinicia el moviment i l'animació de tots els enemics
      this.enemies.forEach((enemy) => {
        enemy.start(this.grid, this.ctx);
      });

      this.startCreatingEnemies();
      this.bombSpriteInterval();
      this.intervalGame = window.requestAnimationFrame(this.update.bind(this));
    }
  }

  update(currentTime) {
    this.clear(); // Neteja tot el canvas
    this.drawBoard(); // Dibuixa el fons verd
    this.drawBoardElements(); // Dibuixa els blocs, bombes i altres elements

    // Actualitzar i dibuixar el player
    this.player.updatePlayerFrame(currentTime); // Actualitza l'animació del player
    if (!this.enemyMeetPlayer()) {
      this.player.drawPlayer(this.ctx); // Dibuixa el player si no ha col·lisionat amb enemics
    } else {
      this.pause(); // Pausa el joc si el player és atrapat
      this.onGameOver(); // Mostra la pantalla de Game Over
      return; // Finalitza l'actualització per evitar dibuixar més
    }

    // Actualitzar i dibuixar enemics
    this.enemies.forEach((enemy) => {
      enemy.updateFrame(currentTime); // Actualitza el frame de l'enemic
      enemy.drawEnemy(this.ctx); // Dibuixa l'enemic
    });

    this.addScore(); // Actualitza el marcador
    this.startMoveEnemies(); // Inicia el moviment dels enemics

    // Continuar amb el cicle de joc
    if (this.intervalGame !== undefined) {
      this.intervalGame = window.requestAnimationFrame(this.update.bind(this));
    }
  }
}
