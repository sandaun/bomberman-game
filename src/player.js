class Player {
  constructor(maxRows, maxColumns) {
    this.row = 50;
    this.column = 50;
    this.height = 8; 
    this.width = 8;
    this.direction = 'right';
    this.intervalId = undefined;
    this.maxRows = maxRows;
    this.maxColumns = maxColumns;
  }

  _moveDirection () {
    switch (this.direction) {
      case 'up':
        this.row -= 10;
        break;
      case 'down':
        this.row += 10;
        break;
      case 'left':
        this.column -= 10;
        break;
      case 'right':
        this.column += 10;
        break;
    }

  }

}