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
  drawBoard () {
    this.ctx.fillStyle = "#41ae41";
    this.ctx.fillRect(0,0, this.columns * this.widthCell, this.rows * this.widthCell);
  }

  drawBoardElements () {
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
          this.ctx.drawImage(brick, j * this.widthCell, i * this.widthCell, this.widthCell, this.widthCell);
        }
        if (this.grid.gameGrid[i][j] === this.grid.gridElements.key) {
          this.ctx.drawImage(door, j * this.widthCell, i * this.widthCell, this.widthCell, this.widthCell);
        }
        if (this.grid.gameGrid[i][j] === this.grid.gridElements.breakableBrick) {
          this.ctx.drawImage(brickbreak, j * this.widthCell, i * this.widthCell, this.widthCell, this.widthCell);
        }
        if (this.grid.gameGrid[i][j] === this.grid.gridElements.bomb) {
          this.bombSpriteGridJ = j;
          this.bombSpriteGridI = i;
          this.ctx.drawImage(this.player.bombSprite, this.player.srcX, this.player.srcY, this.player.widthFrame, this.player.heightFrame, j * this.widthCell, i * this.widthCell, this.player.widthFrame, this.player.heightFrame);
          // this.ctx.drawImage(bomb, j * this.widthCell, i * this.widthCell, this.widthCell, this.widthCell);
        }
      }
    }
  }

  bombSpriteInterval () {
    this.bombInterval = setInterval(function(){this.player.updateFrame(this.ctx, this.bombSpriteGridJ * this.widthCell, this.bombSpriteGridI * this.widthCell);}.bind(this), 150);
  }

  // ----------------- CHECK COLLISIONS ------------------
  checkCollision( x, y ) {
    let x1 = Math.floor(x + 1 / this.widthCell), 
        y1 = Math.floor(y + 1 / this.widthCell),
        x2 = Math.floor(x + 1 - 1 / this.widthCell), 
        y2 = Math.floor(y + 1 - 1 / this.widthCell);

    if (this.checkTileContent(y1, x1, y2, x2, this.grid.gridElements.key)) { // You win on this case!
      this.pause();
      this.onWinGame();
    } else if (this.checkTileContent(y1, x1, y2, x2, this.grid.gridElements.empty)) {
        return true; // Collision
    }
    return false;
  }

  checkTileContent(y1, x1, y2, x2, content) {
    if (content === this.grid.gridElements.empty) {
      return this.grid.gameGrid[y1][x1] !== content || this.grid.gameGrid[y2][x1] !== content || this.grid.gameGrid[y1][x2] !== content || this.grid.gameGrid[y2][x2] !== content;
    } 
    return this.grid.gameGrid[y1][x1] === content || this.grid.gameGrid[y2][x1] === content || this.grid.gameGrid[y1][x2] === content || this.grid.gameGrid[y2][x2] === content;
  }

  // --------------- PLAYER FUNCTIONS ------------------
  drawPlayer () {
    if (this.player.direction === 'up') {
      let playerUp = new Image();
      playerUp.src = 'images/playerUp.png';
      this.ctx.drawImage(playerUp, this.player.positionX, this.player.positionY, this.player.height, this.player.width);
    }
    if (this.player.direction === 'down') {
      let playerDown = new Image();
      playerDown.src = 'images/playerDown.png';
      this.ctx.drawImage(playerDown, this.player.positionX, this.player.positionY, this.player.height, this.player.width);
    }
    if (this.player.direction === 'left') {
      let playerLeft = new Image();
      playerLeft.src = 'images/playerLeft.png';
      this.ctx.drawImage(playerLeft, this.player.positionX, this.player.positionY, this.player.height, this.player.width);
    }
    if (this.player.direction === 'right') {
      let playerRight = new Image();
      playerRight.src = 'images/playerRight.png';
      this.ctx.drawImage(playerRight, this.player.positionX, this.player.positionY, this.player.height, this.player.width);
    }
  }
  
  assignControlsToKeys () {
    document.onkeydown = (e) => {
      switch (e.keyCode) {
        case 87: // W
          this.player.direction = 'up';
        break;
        case 83: // S
          this.player.direction = 'down';
        break;
        case 65: // A
          this.player.direction = 'left';
        break;
        case 68: // D
          this.player.direction = 'right';
        break;
        case 38: //arrow up
          this.player.direction = 'up';
          if(!this.checkCollision(this.player.positionX / this.widthCell, (this.player.positionY - 10) / this.widthCell)){
            this.player.moveDirection();
          }
          break;
        case 40: //arrow down
          this.player.direction = 'down';
          if(!this.checkCollision(this.player.positionX / this.widthCell, (this.player.positionY + 10) / this.widthCell)){
            this.player.moveDirection();
          }
          break;
        case 37: //arrow left
          this.player.direction = 'left';
          if(!this.checkCollision((this.player.positionX - 10) / this.widthCell, this.player.positionY / this.widthCell)){
            this.player.moveDirection();
          }
          break;
        case 39: //arrow right
          this.player.direction = 'right';
          if(!this.checkCollision((this.player.positionX + 10) / this.widthCell, this.player.positionY / this.widthCell)){
            this.player.moveDirection();
          }
          break; 
        case 32: //space
          this.throwTheBomb();
          break; 
        case 80: // p pause
          this.pause();
          break;
      }
    };
  }

// ----------------------------- THROWING THE BOMB FUNCTIONS ----------------------------------
  throwTheBomb() {
    let bombGridPosition = this.player.throwBomb();
    let buildBomb = this.grid.buildBomb(bombGridPosition);
    if (buildBomb === true) {
      let timeoutId = setTimeout(function () {
        this.grid.destroyElements(bombGridPosition, this.player.bombRange);
        this.isPlayerHit(bombGridPosition);
        this.isEnemyHit(bombGridPosition);
      }.bind(this), 3000);
    }
  }

  isPlayerHit(bombGridPosition) {
    if (this.player.bombVsPlayerPosition(bombGridPosition)) {
        let timeoutId = setTimeout(function () { // This timeout is to give the bomb time to destroy the elements before stopping the game.
          this.pause();
          this.onGameOver();
        }.bind(this),500);
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
  drawEnemy () {
    this.enemies.forEach((enemy) => {
      this.ctx.drawImage(enemy.enemyImage, enemy.positionX, enemy.positionY, enemy.height, enemy.width);
    });
  }

  // COLLISION BETWEEN PLAYER AND ENEMY
  enemyMeetPlayer () {
    this.enemies.forEach((enemy) => {

      let playerLeft = this.player.positionX;
      let playerRight = this.player.positionX + this.widthCell;
      let playerUp = this.player.positionY;
      let playerDown = this.player.positionY + this.widthCell;
      let enemyLeft = enemy.positionX;
      let enemyRight = enemy.positionX + this.widthCell;
      let enemyUp =  enemy.positionY;
      let enemyDown = enemy.positionY + this.widthCell;
  
      if (playerRight > enemyLeft && playerLeft < enemyRight && playerDown > enemyUp && playerUp < enemyDown) {
        this.player.playerIsHit = true;
      }
    });
    return this.player.playerIsHit;
  }
  
  createEnemies () {
    if (this.gameBegins === true) {
      for (let i = 0; i < this.quantityEnemies; i++) {
        this.enemies.push(new Enemy(this.columns, this.rows, this.widthCell));
      }
      this.gameBegins = false;
    } else {
      this.enemies.push(new Enemy(this.columns, this.rows, this.widthCell));
    }
  }

  startCreatingEnemies () {
    this.createEnemiesInterval = setInterval(this.createEnemies.bind(this), 30000);
  }

  startMoveEnemies() {
    this.enemies.forEach((enemy) => {
      enemy.move(this.grid);
    });
  }

  // ------------------------ POINTS ------------------------- 
  addScore () {
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
    this.ctx.clearRect(0, 0, this.columns * this.widthCell, this.rows * this.widthCell);
  }

  pause () {
    if (this.intervalGame) {
      this.enemies.forEach((enemy) => {
        enemy.stop();
      });
      clearInterval(this.createEnemiesInterval);
      clearInterval(this.bombInterval);
      window.cancelAnimationFrame(this.intervalGame);
      this.intervalGame = undefined;
    } else {
      this.enemies.forEach((enemy) => {
        enemy.start(this.grid);
      });
      this.startCreatingEnemies();
      this.bombSpriteInterval();
      this.intervalGame = window.requestAnimationFrame(this.update.bind(this));
    }
  }

  update() {
    this.clear();
    this.drawBoard();
    this.drawBoardElements();
    if (!this.enemyMeetPlayer()){
      this.drawPlayer();
    } else {
      this.pause();
      this.onGameOver();
    }
    this.drawEnemy();
    this.addScore();
    this.startMoveEnemies();
    if (this.intervalGame !== undefined) {
      this.intervalGame = window.requestAnimationFrame(this.update.bind(this));
    }
  }

}