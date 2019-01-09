class Enemy {
  constructor(maxColumns, maxRows, widthCell) {
    this.positionX = maxColumns * widthCell - widthCell * 2; // Enemy position initial, just oposite from player
    this.positionY = maxRows * widthCell - widthCell * 2; // Enemy position initial, just oposite from player
    this.widthCell = widthCell; // Cell size if needed
    this.height = 50; 
    this.width = 50;
    this.direction = 'up';
    this.intervalId = undefined;
    this.maxRows = maxRows;
    this.maxColumns = maxColumns;
    this.bombRange = 1; // Range cells for the bomb when explotes
  }

  // start () {
  //   this.move();
  // }

  move (grid) {
    if (!this.intervalId) {
      this.intervalId = setInterval(this.moveDirection.bind(this), 50, grid);
    }
  }

  moveDirection (grid) {
    switch (this.direction) {
      case 'up':
        if(!this.checkCollision(this.positionX / this.widthCell, (this.positionY - 10) / this.widthCell, grid)){
          this.positionY -= 10;
        } else {
          if (this.randomDirection() !== 'up') {
            this.direction = this.randomDirection();
          }
        }
        break;
      case 'down':
        if(!this.checkCollision(this.positionX / this.widthCell, (this.positionY + 10) / this.widthCell, grid)){
          this.positionY += 10;
        } else {
          if (this.randomDirection() !== 'down') {
            this.direction = this.randomDirection();
          }
        }
        break;
      case 'left':
        if(!this.checkCollision((this.positionX - 10) / this.widthCell, this.positionY / this.widthCell, grid)){
          this.positionX -= 10;
        } else {
          if (this.randomDirection() !== 'left') {
            this.direction = this.randomDirection();
          }
        }
        break;
      case 'right':
        if(!this.checkCollision((this.positionX + 10) / this.widthCell, this.positionY / this.widthCell, grid)){
          this.positionX += 10;
        } else {
          if (this.randomDirection() !== 'right') {
            this.direction = this.randomDirection();
          }
        }
        break;
    }

  }

  randomDirection () {
    let enemyDirections = ['up', 'down', 'left', 'right'];
    let randomIndex = Math.floor(Math.random() * enemyDirections.length); 
    let randomDirection = enemyDirections[randomIndex];
    return randomDirection;
  }

  stop () {
    if ( this.intervalId ) {
      clearInterval(this.intervalId)
      this.intervalId = undefined;
    }
  }  

  checkCollision( x, y, grid ) {
    let x1 = Math.floor(x + 1 / this.widthCell), 
        y1 = Math.floor(y + 1 / this.widthCell),
        x2 = Math.floor(x + 1 - 1 / this.widthCell), 
        y2 = Math.floor(y + 1 - 1 / this.widthCell);

    if (this.checkTileContent(y1, x1, y2, x2, grid.gridElements.key, grid)) {
      console.log('You win');
      //this.onGameOver(); // THIS SHALL BE ERASEEEEEEEEEEEEEEEEED !!!!!!!!!!!!!!!!!!!!!!!!!!
    } else if (this.checkTileContent(y1, x1, y2, x2, grid.gridElements.empty, grid)) {
        return true; // Collision
    }
    return false;
  }

  checkTileContent(y1, x1, y2, x2, content, grid) {
    if (content === grid.gridElements.empty) {
      return grid.gameGrid[y1][x1] !== content || grid.gameGrid[y2][x1] !== content || grid.gameGrid[y1][x2] !== content || grid.gameGrid[y2][x2] !== content;
    } 
    return grid.gameGrid[y1][x1] === content || grid.gameGrid[y2][x1] === content || grid.gameGrid[y1][x2] === content || grid.gameGrid[y2][x2] === content;
  }


  // This function calculates player position (column and row) and returns a position array where to throw
  // the bomb depending on the player direction. TO IMPROVE: just make player turn itself first and not move.
  // throwBomb () {
  //   let { playerRightSide, playerLeftSide, playerUpSide, playerDownSide } = this.playerSideBySide();
  //   let bombPositionX = 0;
  //   let bombPositionY = 0;
  //   let bombGridPosition = [];

  //   switch (this.direction) {
  //     case 'up': 
  //       bombPositionX = playerLeftSide; // Or rightside
  //       bombPositionY = playerUpSide - 1;
  //       bombGridPosition.push(bombPositionY, bombPositionX);  
  //       break;
  //     case 'down':
  //       bombPositionX = playerLeftSide; // Or rightside
  //       bombPositionY = playerDownSide + 1;
  //       bombGridPosition.push(bombPositionY, bombPositionX);      
  //       break;
  //     case 'left':
  //       bombPositionX = playerLeftSide - 1;
  //       bombPositionY = playerDownSide; // Or upSide
  //       bombGridPosition.push(bombPositionY, bombPositionX);
  //       break;
  //     case 'right':
  //       bombPositionX = playerRightSide + 1;
  //       bombPositionY = playerDownSide; // Or upSide
  //       bombGridPosition.push(bombPositionY, bombPositionX);
  //       break;
  //   }
  //   return bombGridPosition;
  // }

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