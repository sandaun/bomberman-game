class Grid {
  constructor(maxColumns, maxRows, widthCell) {
    this.maxRows = maxRows;
    this.maxColumns = maxColumns;
    this.widthCell = widthCell;
    this.gridElements = {
      empty: '',
      player: 'P',
      brick: 'B',
      key: 'K',
      breakableBrick: 'BB',
      enemy: 'E',
      bomb: 'BM',
      flame: 'F'
    };
    this.quantityBreakable = 1;
    // this.grid = [
    //   ['B','B','B','B','B','B','B','B','B','B','B','B','B','B','B'],
    //   ['B','','','','','','','','','','','','','','B'],
    //   ['B','','B','','B','','B','','B','','B','','B','','B'],
    //   ['B','','','','','','','','','','','','','','B'],
    //   ['B','','B','','B','','B','','B','','B','','B','','B'],
    //   ['B','','','','','','','','','','','','','','B'],
    //   ['B','','B','','B','','B','','B','','B','','B','','B'],
    //   ['B','','','','','','','','','','','','','','B'],
    //   ['B','','B','','B','','B','','B','','B','','B','','B'],
    //   ['B','','','','','','','','','','','','','','B'],
    //   ['B','','B','','B','','B','','B','','B','','B','','B'],
    //   ['B','','','','','','','','','','','','','','B'],
    //   ['B','B','B','B','B','B','B','B','B','B','B','B','B','B','B'],
    // ];
    this.gameGrid = this.generateGrid();
    this.buildFixedBricks();
    // this.buildPlayer();
    this.buildKey();
    this.buildbreakableBrick();
  }

  generateGrid () {
    let newGrid = new Array(this.maxRows);

    for (let i = 0; i < this.maxRows; i++) {
      newGrid[i] = new Array(this.maxColumns);
    }
    for (let i = 0; i < newGrid.length; i++) {
      for (let j = 0; j < newGrid[i].length; j++) {
        newGrid[i][j] = this.gridElements.empty;  
      }
    }
    return newGrid;
  }

  buildFixedBricks () {
    for (let i = 0; i < this.gameGrid[0].length; i++) {
      this.gameGrid[0][i] = this.gridElements.brick;
      this.gameGrid[this.maxRows-1][i] = this.gridElements.brick;
    }
    for (let i = 0; i < this.gameGrid.length; i++) {
      this.gameGrid[i][0] = this.gridElements.brick;
      this.gameGrid[i][this.maxColumns-1] = this.gridElements.brick;
    }
    for (let i = 1; i < this.gameGrid.length-1; i++) {
      if(i % 2 === 0) { 
        for (let j = 1; j < this.gameGrid[i].length-1; j++) {
          if(j % 2 === 0) {
            this.gameGrid[i][j] = this.gridElements.brick;
          }
        }
      }
    }
  }

  // buildPlayer () { // ABANS D'IMPLEMENTAR TENIR EN COMPTE QUE NO COLISIONI AMB SI MATEIX SINO NO ES MOURÀ
  //   this.gameGrid[1][1] = this.gridElements.player;
  // }

  buildKey () {
    let randomGridPosition = this.randomGridLoop();
    if (randomGridPosition != null && randomGridPosition.length > 0) {
      this.gameGrid[randomGridPosition[0]][randomGridPosition[1]] = this.gridElements.key;
    }
  }

  buildbreakableBrick () {
    for (let i = 0; i < this.quantityBreakable; i++) {
      let randomGridPosition = this.randomGridLoop();
      if (randomGridPosition != null && randomGridPosition.length > 0) {
        this.gameGrid[randomGridPosition[0]][randomGridPosition[1]] = this.gridElements.breakableBrick;
      }
    }
  }

  randomGridLoop() {
    let isBlank = false;
    while(!isBlank){
      let cols = this.gameGrid[0].length;
      let rows = this.gameGrid.length;
      let posX = Math.floor(Math.random() * (cols - 1));
      let posY = Math.floor(Math.random() * (rows - 1));
      if (!this.isPositionForbidden(posX, posY) && this.gameGrid[posY][posX] === this.gridElements.empty) {
        isBlank = true;
        let positionArray = [];
        positionArray.push(posY, posX);
        return positionArray;
      }
    }
  }
  
// This function avoids getting random positions that wouldn't let Player begin properly at the game.
  isPositionForbidden (x, y) {
    if (x === 1 && y === 1) {
      return true;
    }
    if (x === 2 && y === 1) {
      return true;
    }
    if (x === 1 && y === 2) {
      return true;
    }
    return false;
  }

    // THIS RECURSIVE RANDOM FUNCTION DIDN'T WORKED. TRIED THE ABOVE WITH WHILE AND WORKED FINE. WHY??

  // randomGripRecursive(posX, posY) {
  //   if (this.grid[posX][posY] !== '') {
  //     posX = Math.floor(Math.random() * (this.rows-1));
  //     posY = Math.floor(Math.random() * (this.columns-1));
  //     this.randomGripRecursive(posX, posY);
  //   } else {
  //     let posArray = [];
  //     posArray.push(posX, posY);
  //     console.log('random grid position finished '+ posArray);
  //     return posArray;
  //   }
  // }
   
}