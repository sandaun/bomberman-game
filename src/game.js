class Game {
  constructor(options) {
    this.player = new Player(options.rows, options.columns, options.widthCell);
    // this.player = options.player;
    this.fixObstacle = undefined;
    this.rows = options.rows;
    this.columns = options.columns;
    this.widthCell = options.widthCell;
    this.ctx = options.ctx;
    this.intervalGame = undefined;
    // this.enemy = options.enemy;
    // this.randomObstacle = undefined;
    // this.updatePointsCB = undefined;
    // this.points = 0;
    this.grid = [
      ['B','B','B','B','B','B','B','B','B','B','B','B','B','B','B'],
      ['B','','','K','','','','','','','','','','','B'],
      ['B','','B','','B','','B','','B','','B','','B','','B'],
      ['B','','','','','','','','','','','','','','B'],
      ['B','','B','','B','','B','','B','','B','','B','','B'],
      ['B','','','','','','','','','','','','','','B'],
      ['B','','B','','B','','B','','B','','B','','B','','B'],
      ['B','','','','','','','','','','','','','','B'],
      ['B','','B','','B','','B','','B','','B','','B','','B'],
      ['B','','','','','','','','','','','','','','B'],
      ['B','','B','','B','','B','','B','','B','','B','','B'],
      ['B','','','','','','','','','','','','','','B'],
      ['B','B','B','B','B','B','B','B','B','B','B','B','B','B','B'],
    ];
  }

  // --------------- BOARD FUNCTIONS ----------------
  drawBoard () {
    this.ctx.fillStyle = "#41ae41";
    this.ctx.fillRect(0,0, this.rows * this.widthCell, this.columns * this.widthCell);
  }

  drawBricks () {
    for (let i = 0; i < this.grid.length; i++) {
      for (let j = 0; j < this.grid[i].length; j++) {
        if (this.grid[i][j] === 'B') {
        this.ctx.fillStyle = 'gray';
        this.ctx.fillRect(j * this.widthCell, i * this.widthCell, this.widthCell, this.widthCell);
        }
      }
    }
  }

  drawKey () {
    if (this.grid[1][3] === 'K') { // TO-DO RANDOM
      this.ctx.fillStyle = 'blue';
      this.ctx.fillRect(150, 50, this.widthCell, this.widthCell);
    }
  }

  checkCollision( x, y ) {
    let x1 = Math.floor(x + 1 / this.widthCell), 
        y1 = Math.floor(y + 1 / this.widthCell),
        x2 = Math.floor(x + 1 - 1 / this.widthCell), 
        y2 = Math.floor(y + 1 - 1 / this.widthCell);

    if (this.grid[y1][x1] === 'K' || this.grid[y2][x1] === 'K' || this.grid[y1][x2] === 'K' || this.grid[y2][x2] === 'K') {
      console.log('You win');
      this.onGameOver(); // POSAR EN FUNCIÓ A ASSIGNCONTROLS AMB SWITCH-CASE
      return true;  
    } else if (this.grid[y1][x1] !== '' || this.grid[y2][x1] !== '' || this.grid[y1][x2] !== '' || this.grid[y2][x2] !== '') {
      return true; // Collision
    }
    return false;
  }

  // --------------- PLAYER FUNCTIONS ------------------
  drawPlayer () {
    this.ctx.fillStyle = 'red';
    this.ctx.fillRect(this.player.positionX, this.player.positionY, this.player.height, this.player.width);
  }
  
  assignControlsToKeys () {
    document.onkeydown = (e) => {
      switch (e.keyCode) {
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
        // case 80: // p pause
        //   this.snake.intervalId ? this.snake.stop() : this.snake.start()
        //   break;
      }
    };
  }

  // ----------------- INITIALIZING GAME AND UPDATING CANVAS ------------------

  start() {
    this.assignControlsToKeys();
    this.update();
  }

  update() {
    this.clear();
    this.drawBoard();
    this.drawBricks();
    this.drawPlayer();
    this.drawKey();
    this.intervalGame = window.requestAnimationFrame(this.update.bind(this));
  }

  clear() {
    this.ctx.clearRect(0, 0, this.rows * this.widthCell, this.columns * this.widthCell);
  }

}