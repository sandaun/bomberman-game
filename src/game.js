class Game {
  constructor(options) {
    this.player = options.player;
    // this.enemy = options.enemy;
    this.fixObstacle = undefined;
    // this.randomObstacle = undefined;
    this.rows = options.rows;
    this.columns = options.columns;
    this.ctx = options.ctx;
    this.intervalGame = undefined;
    // this.updatePointsCB = undefined;
    // this.points = 0;
    this.grid = [
      ['','','','','','','','','','','','',''],
      ['','B','','B','','B','','B','','B','','B',''],
      ['','','','','','','','','','','','',''],
      ['','B','','B','','B','','B','','B','','B',''],
      ['','','','','','','','','','','','',''],
      ['','B','','B','','B','','B','','B','','B',''],
      ['','','','','','','','','','','','',''],
      ['','B','','B','','B','','B','','B','','B',''],
      ['','','','','','','','','','','','',''],
      ['','B','','B','','B','','B','','B','','B',''],
      ['','','','','','','','','','','','',''],
    ];
  }

  // --------------- BOARD FUNCTIONS ----------------
  drawBoard () {
    this.ctx.fillStyle = "#41ae41";
    this.ctx.fillRect(0,0, this.rows * 50, this.columns * 50);
  }

  drawBricks () {
    for (let i = 0; i < this.grid.length; i++) {
      for (let j = 0; j < this.grid[i].length; j++) {
        if (this.grid[i][j] === 'B') {
        this.ctx.fillStyle = 'gray';
        this.ctx.fillRect(j * 50, i * 50, 50, 50);
        }
      }
    }
  }

  checkCollision( x, y ) {
    let x1 = Math.floor(x + 1 / this.player.width), 
        y1 = Math.floor(y + 1 / this.player.height),
        x2 = Math.floor(x + 1 - 1 / this.player.width), 
        y2 = Math.floor(y + 1 - 1 / this.player.height);
        console.log('x1 ' + x1);
        console.log('y1 ' + y1);
        console.log('x2 ' + x2);
        console.log('y1 ' + y2);
    if (this.grid[y1][x1] !== '' || this.grid[y2][x1] !== '' || this.grid[y1][x2] !== '' || 
        this.grid[y2][x2] !== '') {
      console.log("collision");
      return true; // Collision
    }
    console.log("not collision");
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
        console.log(this.player.positionX/50);
        console.log(this.player.positionY/50);
          this.player.direction = 'up';
          if (!this.checkCollision(this.player.positionX / 50, this.player.positionY / 50)) {
          this.player.moveDirection();
          }
          break;
        case 40: //arrow down
          this.player.direction = 'down';
          this.player.moveDirection();
          break;
        case 37: //arrow left
          this.player.direction = 'left';
            this.player.moveDirection();
          break;
        case 39: //arrow right
          this.player.direction = 'right';
          this.player.moveDirection();
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
    this.intervalGame = window.requestAnimationFrame(this.update.bind(this));
  }

  clear() {
    this.ctx.clearRect(0, 0, this.rows * 10, this.columns * 10);
  }

}