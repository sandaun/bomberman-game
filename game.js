class Game {
  constructor(options) {
    this.player = new Player(options.columns, options.rows, options.widthCell);
    this.grid = new Grid(options.columns, options.rows, options.widthCell);
    this.enemy = new Enemy(options.columns, options.rows, options.widthCell);
    this.fixObstacle = undefined; // Not used at the moment, maybe in Grid class
    this.rows = options.rows;
    this.columns = options.columns;
    this.widthCell = options.widthCell;
    this.ctx = options.ctx;
    this.intervalGame = undefined;
    // this.updatePointsCB = undefined;
    this.points = 0;
  }

  // --------------- DRAW BOARD FUNCTIONS ----------------
  drawBoard () {
  //   var img = new Image();
  //   img.src = '/Users/oriolcarbo/code/ironhack/module-1/bomberman-game/images/grass.png';
  //   this.ctx.drawImage(img, 0, 0,this.columns * this.widthCell, this.rows * this.widthCell);
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

    for (let i = 0; i < this.grid.gameGrid.length; i++) {
      for (let j = 0; j < this.grid.gameGrid[i].length; j++) {
        if (this.grid.gameGrid[i][j] === this.grid.gridElements.brick) {
          //this.ctx.fillStyle = 'gray';
          //this.ctx.fillRect(j * this.widthCell, i * this.widthCell, this.widthCell, this.widthCell);
          this.ctx.drawImage(brick, j * this.widthCell, i * this.widthCell, this.widthCell, this.widthCell);
        }
        if (this.grid.gameGrid[i][j] === this.grid.gridElements.key) {
          this.ctx.fillStyle = 'blue';
          this.ctx.fillRect(j * this.widthCell, i * this.widthCell, this.widthCell, this.widthCell);
        }
        if (this.grid.gameGrid[i][j] === this.grid.gridElements.breakableBrick) {
          //this.ctx.fillStyle = 'darkgrey';
          //this.ctx.fillRect(j * this.widthCell, i * this.widthCell, this.widthCell, this.widthCell);
          this.ctx.drawImage(brickbreak, j * this.widthCell, i * this.widthCell, this.widthCell, this.widthCell);
        }
        if (this.grid.gameGrid[i][j] === this.grid.gridElements.bomb) {
          // this.ctx.fillStyle = 'black';
          // this.ctx.fillRect(j * this.widthCell, i * this.widthCell, this.widthCell, this.widthCell);
          this.ctx.drawImage(bomb, j * this.widthCell, i * this.widthCell, this.widthCell, this.widthCell);
        }
      }
    }
  }

  // ----------------- CHECK COLLISIONS ------------------
  checkCollision( x, y ) {
    let x1 = Math.floor(x + 1 / this.widthCell), 
        y1 = Math.floor(y + 1 / this.widthCell),
        x2 = Math.floor(x + 1 - 1 / this.widthCell), 
        y2 = Math.floor(y + 1 - 1 / this.widthCell);

    if (this.checkTileContent(y1, x1, y2, x2, this.grid.gridElements.key)) {
      console.log('You win');
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
    // this.ctx.fillStyle = '#FFFF33';
    // this.ctx.fillRect(this.player.positionX, this.player.positionY, this.player.height, this.player.width);
    if (this.player.direction === 'up') {
      let bomb = new Image();
      bomb.src = 'images/playerUp.png';
      this.ctx.drawImage(bomb, this.player.positionX, this.player.positionY, this.player.height, this.player.width);
    }
    if (this.player.direction === 'down') {
      let bomb = new Image();
      bomb.src = 'images/playerDown.png';
      this.ctx.drawImage(bomb, this.player.positionX, this.player.positionY, this.player.height, this.player.width);
    }
    if (this.player.direction === 'left') {
      let bomb = new Image();
      bomb.src = 'images/playerLeft.png';
      this.ctx.drawImage(bomb, this.player.positionX, this.player.positionY, this.player.height, this.player.width);
    }
    if (this.player.direction === 'right') {
      let bomb = new Image();
      bomb.src = 'images/playerRight.png';
      this.ctx.drawImage(bomb, this.player.positionX, this.player.positionY, this.player.height, this.player.width);
    }
    // this.player.updateFrame(this.ctx); THIS IS FOR THE SPRITE
    // this.ctx.drawImage(this.player.character, this.player.srcX, this.player.srcY, this.player.widthFrame, this.player.heightFrame, this.player.x, this.player.y, this.player.widthFrame, this.player.heightFrame);
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
          // this.enemy.intervalId ? this.enemy.stop() : this.enemy.start(this.grid);
          this.pause();
          break;
      }
    };
  }

  throwTheBomb() {
    let bombGridPosition = this.player.throwBomb();
    let buildBomb = this.grid.buildBomb(bombGridPosition);
    if (buildBomb === true) {
      let timeoutId = setTimeout(function () {
        this.grid.destroyElements(bombGridPosition, this.player.bombRange);
        if (this.player.bombVsPlayerPosition(bombGridPosition)) {
          // this.onGameOver();
          console.log('You are DEAD');
        }
        if (this.enemy.bombVsEnemyPosition(bombGridPosition)) {
          console.log('Enemy hit');
        }
      }.bind(this), 3000);
    }
  }

  // ----------------- ENEMY FUNCTIONS ------------------
  drawEnemy () {
    // this.ctx.fillStyle = '#FF3333';
    // this.ctx.fillRect(this.enemy.positionX, this.enemy.positionY, this.enemy.height, this.enemy.width);
    let enemy = new Image();
    enemy.src = 'images/enemy.png';
    this.ctx.drawImage(enemy, this.enemy.positionX, this.enemy.positionY, this.enemy.height, this.enemy.width);
  }

  // COLLISION BETWEEN PLAYER AND ENEMY
  enemyMeetPlayer () {
    let playerLeft = this.player.positionX;
    let playerRight = this.player.positionX + this.widthCell;
    let playerUp = this.player.positionY;
    let playerDown = this.player.positionY + this.widthCell;
    let enemyLeft = this.enemy.positionX;
    let enemyRight = this.enemy.positionX + this.widthCell;
    let enemyUp =  this.enemy.positionY;
    let enemyDown = this.enemy.positionY + this.widthCell;

    if (playerRight > enemyLeft && playerLeft < enemyRight && playerDown > enemyUp && playerUp < enemyDown) {
      return true;
    }
  }

  // ------------------------ POINTS ------------------------- 
  addScore () {
    let bomberScore = document.getElementById('points'); 
    bomberScore.innerHTML = this.grid.points;
    return bomberScore;
  }

  // ----------------- INITIALIZING GAME AND UPDATING CANVAS ------------------

  start() {
    this.assignControlsToKeys();
    this.enemy.move(this.grid);
    this.update();
    this.intervalGame = window.requestAnimationFrame(this.update.bind(this));
  }

  clear() {
    this.ctx.clearRect(0, 0, this.columns * this.widthCell, this.rows * this.widthCell);
  }

  pause () {
    if (this.intervalGame) {
      this.enemy.stop();
      window.cancelAnimationFrame(this.intervalGame);
      this.intervalGame = undefined;
    } else {
      this.enemy.start(this.grid);
      this.intervalGame = window.requestAnimationFrame(this.update.bind(this));
    }
  }

  update() {
    this.clear();
    this.drawBoard();
    this.drawBoardElements();
    if (!this.enemyMeetPlayer()){
      this.drawPlayer();
    }
    this.drawEnemy();
    this.addScore();
    //this.drawPlayer();
    //this.enemy.moveDirection(this.grid);
    if (this.intervalGame !== undefined) {
      this.intervalGame = window.requestAnimationFrame(this.update.bind(this));
    }
  }

}