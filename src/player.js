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
    this.bombRange = 1; // Range cells for the bomb when explotes
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
    let { playerRightSide, playerLeftSide, playerUpSide, playerDownSide } = this.playerSideBySide();
    let bombPositionX = 0;
    let bombPositionY = 0;
    let bombGridPosition = [];

    switch (this.direction) {
      case 'up': 
        bombPositionX = playerLeftSide; // Or rightside
        bombPositionY = playerUpSide - 1;
        bombGridPosition.push(bombPositionY, bombPositionX);  
        break;
      case 'down':
        bombPositionX = playerLeftSide; // Or rightside
        bombPositionY = playerDownSide + 1;
        bombGridPosition.push(bombPositionY, bombPositionX);      
        break;
      case 'left':
        bombPositionX = playerLeftSide - 1;
        bombPositionY = playerDownSide; // Or upSide
        bombGridPosition.push(bombPositionY, bombPositionX);
        break;
      case 'right':
        bombPositionX = playerRightSide + 1;
        bombPositionY = playerDownSide; // Or upSide
        bombGridPosition.push(bombPositionY, bombPositionX);
        break; // Still needed?
    }
    return bombGridPosition;
  }

  // This function calculates if player is within the range of the bomb explosion in any of the 4 sides. If it is, player is killed (true).
  bombVsPlayerPosition (bombPosition) {
    let { playerRightSide, playerLeftSide, playerUpSide, playerDownSide } = this.playerSideBySide();

    let bombUp = [bombPosition[0] - this.bombRange, bombPosition[1]];
    let bombDown = [bombPosition[0] + this.bombRange, bombPosition[1]];
    let bombLeft = [bombPosition[0], bombPosition[1] - this.bombRange];
    let bombRight = [bombPosition[0], bombPosition[1] + this.bombRange];

    // First if condition checks if player is just in one tile (so x1 x2 are equal, y1 y2 are equal).
    // Second if condition (else if) checks when player can be in two different tiles in X axis (so x1 and x2 are different) or when
    // player can be in two different tiles in y axis (y1 and y2 are different). Then compares this to the different bomb range positions.
    if (playerLeftSide === playerRightSide && playerDownSide === playerUpSide) {
      if ((playerUpSide === bombUp[0] && playerLeftSide === bombUp[1]) || (playerUpSide === bombDown[0] && playerLeftSide === bombDown[1])
         || (playerUpSide === bombLeft[0] && playerLeftSide === bombLeft[1]) || (playerUpSide === bombRight[0] && playerLeftSide === bombRight[1])) {
        return true;
      }
    } else if ((playerUpSide === bombUp[0] && playerLeftSide === bombUp[1]) || (playerDownSide === bombUp[0] && playerRightSide === bombUp[1])
    || (playerUpSide === bombDown[0] && playerLeftSide === bombDown[1]) || (playerDownSide === bombDown[0] && playerRightSide === bombDown[1])
    || (playerUpSide === bombLeft[0] && playerLeftSide === bombLeft[1]) || (playerDownSide === bombLeft[0] && playerRightSide === bombLeft[1])
    || (playerUpSide === bombRight[0] && playerLeftSide === bombRight[1]) || (playerDownSide === bombRight[0] && playerRightSide === bombRight[1])) {
      return true;
    } else {
      return false;
    }
  }

  // This function just defines the 4 player sides (left-right-up-down)
  playerSideBySide() {
    let playerLeftSide = Math.floor((this.positionX) / this.widthCell + 1 / this.widthCell); // x1
    let playerRightSide = Math.floor((this.positionX) / this.widthCell + 1 - 1 / this.widthCell); // x2
    let playerUpSide = Math.floor((this.positionY) / this.widthCell + 1 / this.widthCell); // y1
    let playerDownSide = Math.floor((this.positionY) / this.widthCell + 1 - 1 / this.widthCell); // y2
    return { playerRightSide, playerLeftSide, playerUpSide, playerDownSide };
  }

}