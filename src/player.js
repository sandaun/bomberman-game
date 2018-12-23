class Player {
  constructor(maxRows, maxColumns) {
    this.row = 50;
    this.column = 50;
    this.height = 8; 
    this.width = 8;
    this.direction = 'up';
    this.intervalId = undefined;
    this.maxRows = maxRows;
    this.maxColumns = maxColumns;
  }

  moveDirection () {
    switch (this.direction) {
      case 'up':
        console.log("you are calling up");
        this.column -= 10;
        break;
      case 'down':
        this.column += 10;
        break;
      case 'left':
        this.row -= 10;
        break;
      case 'right':
        this.row += 10;
        break;
    }

  }

}