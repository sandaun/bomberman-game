class Game {
  constructor(options) {
    this.player = options.player;
    // this.enemy = options.enemy;
    this.fixObstacle = undefined;
    // this.randomObstacle = undefined;
    this.rows = options.rows;
    this.columns = options.columns;
    this.ctx = options.ctx;
    // this.updatePointsCB = undefined;
    // this.points = 0;
  }

  drawBoard () {
    this.ctx.fillStyle = "#41ae41";
    
    this.ctx.fillRect(10,10, this.rows * 10, this.columns * 10);
    // if (this.food) {
    //   this._drawFood();
    // }
  }

  drawPlayer () {
    this.ctx.fillStyle = 'red';
    this.ctx.fillRect(this.player.row, this.player.column, this.player.height, this.player.width);
  }

}