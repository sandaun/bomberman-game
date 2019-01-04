class Player {
  constructor(maxColumns, maxRows, widthCell) {
    this.positionX = 50; // Player position initial
    this.positionY = 50; // Player position initial
    this.widthCell = widthCell; // Cell size if needed
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
       // if (this.positionY > 0) {
          this.positionY -= 10;
       // }
        break;
      case 'down':
       // if (this.positionY < (this.maxColumns * 50 - this.height)) {
          this.positionY += 10;
       // }
        break;
      case 'left':
       // if (this.positionX > 0) {
          this.positionX -= 10;
       // }
        break;
      case 'right':
       // if (this.positionX < (this.maxRows * 50 - this.width)) {
          this.positionX += 10;
       // }  
        break;
    }

  }

  // This function calculates player position (column and row) and returns a position array where to throw
  // the bomb depending on the player direction. TO IMPROVE: just make player turn itself first and not move.
  throwBomb () {
    let playerRightSide = Math.floor((this.positionX) / this.widthCell + 1 - 1 / this.widthCell);
    let playerLeftSide = Math.floor((this.positionX) / this.widthCell + 1 / this.widthCell);
    let playerDownSide = Math.floor((this.positionY) / this.widthCell + 1 - 1 / this.widthCell);
    let playerUpSide = Math.floor((this.positionY) / this.widthCell + 1 / this.widthCell);
    let bombPositionX = 0;
    let bombPositionY = 0;
    let bombGridPosition = [];

    switch (this.direction) {
      case 'up': 
        bombPositionX = playerLeftSide; // Or rightside
        bombPositionY = playerUpSide - 1;
        bombGridPosition.push(bombPositionY, bombPositionX);
        console.log('hey babe its up');
        console.log(bombGridPosition);
        return bombGridPosition;  
        break;
      case 'down':
        bombPositionX = playerLeftSide; // Or rightside
        bombPositionY = playerDownSide + 1;
        bombGridPosition.push(bombPositionY, bombPositionX);
        console.log('hey babe its down');
        console.log(bombGridPosition);
        return bombGridPosition;      
        break;
      case 'left':
        bombPositionX = playerLeftSide - 1;
        bombPositionY = playerDownSide; // Or upSide
        bombGridPosition.push(bombPositionY, bombPositionX);
        console.log('hey babe its left');
        console.log(bombGridPosition);
        return bombGridPosition;
        break;
      case 'right':
        //executar funcio a grid amb coordenades right side i qualsevol posició de up o down sides (pq son iguals) que pinti la bomba
        bombPositionX = playerRightSide + 1;
        bombPositionY = playerDownSide; // Or upSide
        bombGridPosition.push(bombPositionY, bombPositionX);
        console.log('hey babe its right');
        console.log(bombGridPosition);
        return bombGridPosition;
        break; // Still needed?
    }
  }

}