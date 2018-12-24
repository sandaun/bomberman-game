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
    this.ctx.fillRect(0,0, this.rows * 10, this.columns * 10);
  }
  
  drawBricks () {
    for (let i = 0; i < this.grid.length; i++) {
      for (let j = 0; j < this.grid[i].length; j++) {
        if (this.grid[i][j] === 'B') {
        this.ctx.fillStyle = 'orange';
        this.ctx.fillRect(j * 50, i * 50, 50, 50);
        }
      }
    }
  }

  // --------------- PLAYER FUNCTIONS ------------------
  drawPlayer () {
    this.ctx.fillStyle = 'red';
    this.ctx.fillRect(this.player.row, this.player.column, this.player.height, this.player.width);
  }
  
  assignControlsToKeys () {
    document.onkeydown = (e) => {
      switch (e.keyCode) {
        case 38: //arrow up
          this.player.direction = 'up';
          this.player.moveDirection();
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
    // this.snake.move();
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