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
    this.gameGrid = this.generateGrid(); // COMMENT THE ABOVE HARDCODED GRID

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
   
}