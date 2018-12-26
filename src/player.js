class Player {
  constructor(maxRows, maxColumns) {
    this.positionX = 0; // Player position initial
    this.positionY = 0; // Player position initial
    this.height = 50; 
    this.width = 50;
    this.direction = 'up';
    this.intervalId = undefined;
    this.maxRows = maxRows;
    this.maxColumns = maxColumns;
  }

  moveDirection () {
    switch (this.direction) {
      case 'up':
        if (this.positionY > 0) {
          this.positionY -= 10;
        }
        break;
      case 'down':
        if (this.positionY < (this.maxColumns * 50 - this.height)) {
          this.positionY += 10;
        }
        break;
      case 'left':
        if (this.positionX > 0) {
          this.positionX -= 10;
        }
        break;
      case 'right':
        if (this.positionX < (this.maxRows * 50 - this.width)) {
          this.positionX += 10;
        }  
        break;
    }

  }

}