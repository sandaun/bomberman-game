class Grid {
  constructor(maxColumns, maxRows, widthCell) {
    this.maxRows = maxRows;
    this.maxColumns = maxColumns;
    this.widthCell = widthCell;
    this.points = 0;
    this.gridElements = {
      empty: '',
      brick: 'B',
      key: 'K',
      breakableBrick: 'BB',
      bomb: 'BM',
    };
    this.quantityBreakable = 3;
    this.gameGrid = this.generateGrid();
    this.buildFixedBricks();
    this.buildBreakableBrick();
    this.isKeyBuilt = false;
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

  // buildKey () {
  //   let randomGridPosition = this.randomGridLoop();
  //   if (randomGridPosition != null && randomGridPosition.length > 0) {
  //     this.gameGrid[randomGridPosition[0]][randomGridPosition[1]] = this.gridElements.key;
  //   }
  // }

  isKeyBehindBrickRandom (positionY, positionX) {
    let quantityForRandom = this.quantityBreakable + 1;
    let randomBriks = Math.floor(Math.random() * quantityForRandom);
    if (randomBriks === 0 && this.isKeyBuilt === false) {
      this.gameGrid[positionY][positionX] = this.gridElements.key;
      this.isKeyBuilt = true;
    }
  }

  buildBreakableBrick () {
    for (let i = 0; i < this.quantityBreakable; i++) {
      let randomGridPosition = this.randomGridLoop();
      if (randomGridPosition != null && randomGridPosition.length > 0) {
        this.gameGrid[randomGridPosition[0]][randomGridPosition[1]] = this.gridElements.breakableBrick;
      }
    }
  }

  buildBomb (position) {
    if (position != null && position.length > 0 && this.gameGrid[position[0]][position[1]] === this.gridElements.empty) {
      this.gameGrid[position[0]][position[1]] = this.gridElements.bomb;
      return true;
    }
  }

  destroyElements (bombPosition, bombRange) {
    // Defining the position of the bomb in the grid and adding or removing the range that will affect the nearby cells.
    let bombUp = [bombPosition[0] - bombRange, bombPosition[1]];
    let bombDown = [bombPosition[0] + bombRange, bombPosition[1]];
    let bombLeft = [bombPosition[0], bombPosition[1] - bombRange];
    let bombRight = [bombPosition[0], bombPosition[1] + bombRange];

    if (bombPosition != null && bombPosition.length > 0 && this.gameGrid[bombPosition[0]][bombPosition[1]] === this.gridElements.bomb) {
      this.gameGrid[bombPosition[0]][bombPosition[1]] = this.gridElements.empty; // Deletes the bomb itself
    }
    if (bombPosition != null && bombPosition.length > 0 && this.gameGrid[bombUp[0]][bombUp[1]] === this.gridElements.breakableBrick) { 
      this.gameGrid[bombUp[0]][bombUp[1]] = this.gridElements.empty;
      this.quantityBreakable -=1;
      this.points += 100;
      this.isKeyBehindBrickRandom(bombUp[0], bombUp[1]);
    } 
    if (bombPosition != null && bombPosition.length > 0 && this.gameGrid[bombDown[0]][bombDown[1]] === this.gridElements.breakableBrick) {
      this.gameGrid[bombDown[0]][bombDown[1]] = this.gridElements.empty;
      this.quantityBreakable -=1;
      this.points += 100;
      this.isKeyBehindBrickRandom(bombDown[0], bombDown[1]);
    } 
    if (bombPosition != null && bombPosition.length > 0 && this.gameGrid[bombLeft[0]][bombLeft[1]] === this.gridElements.breakableBrick) {
      this.gameGrid[bombLeft[0]][bombLeft[1]] = this.gridElements.empty;
      this.quantityBreakable -=1;
      this.points += 100;
      this.isKeyBehindBrickRandom(bombLeft[0], bombLeft[1]);
    } 
    if (bombPosition != null && bombPosition.length > 0 && this.gameGrid[bombRight[0]][bombRight[1]] === this.gridElements.breakableBrick) {
      this.gameGrid[bombRight[0]][bombRight[1]] = this.gridElements.empty;
      this.quantityBreakable -=1;
      this.points += 100;
      this.isKeyBehindBrickRandom(bombRight[0], bombRight[1]);
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
    if (x === 13 && y === 11) { // This is enemy initial position
      return true;
    }
    return false;
  }

}