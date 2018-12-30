class Game {
  constructor(options) {
    this.player = new Player(options.columns, options.rows, options.widthCell);
    this.grid2 = new Grid(options.columns, options.rows, options.widthCell); // CHANGE TO grid WHEN FINISHED constructing
    this.grid = [
      ['B','B','B','B','B','B','B','B','B','B','B','B','B','B','B'],
      ['B','','','','','','','','','','','','','','B'],
      ['B','','B','','B','','B','','B','','B','','B','','B'],
      ['B','','','','','','','','','','','','','','B'],
      ['B','','B','','B','','B','','B','','B','','B','','B'],
      ['B','','','','','','','','','','','','','','B'],
      ['B','','B','','B','','B','','B','','B','','B','','B'],
      ['B','','','','','','','','','','','','','','B'],
      ['B','','B','','B','','B','','B','','B','','B','','B'],
      ['B','','','','','','','','','','','','','','B'],
      ['B','','B','','B','','B','','B','','B','','B','','B'],
      ['B','','','','','','','','','','','','','','B'],
      ['B','B','B','B','B','B','B','B','B','B','B','B','B','B','B'],
    ];
    this.fixObstacle = undefined; // Not used at the moment, maybe in Grid class
    this.rows = options.rows;
    this.columns = options.columns;
    this.widthCell = options.widthCell;
    this.ctx = options.ctx;
    this.intervalGame = undefined;
    this.randomGridPos = this.randomGridLoop();
    // this.gridtest = this.grid2.generateGrid(); // COMMENT THE ABOVE HARDCODED GRID
    // this.enemy = options.enemy;
    // this.randomObstacle = undefined;
    // this.updatePointsCB = undefined;
    // this.points = 0;
  }

  // --------------- DRAW BOARD FUNCTIONS ----------------
  drawBoard () {
    this.ctx.fillStyle = "#41ae41";
    this.ctx.fillRect(0,0, this.columns * this.widthCell, this.rows * this.widthCell);
  }

  drawBricks () {
    this.grid2.buildFixedBricks();
    for (let i = 0; i < this.grid2.gameGrid.length; i++) {
      for (let j = 0; j < this.grid2.gameGrid[i].length; j++) {
        if (this.grid2.gameGrid[i][j] === this.grid2.gridElements.brick) {
        this.ctx.fillStyle = 'gray';
        this.ctx.fillRect(j * this.widthCell, i * this.widthCell, this.widthCell, this.widthCell);
        }
      }
    }
  }

  drawKey () {
    if (this.randomGridPos != null && this.randomGridPos.length > 0) {
      this.grid[this.randomGridPos[0]][this.randomGridPos[1]] = 'K';
      this.ctx.fillStyle = 'blue';
      this.ctx.fillRect(this.randomGridPos[1] * this.widthCell, this.randomGridPos[0] * this.widthCell, this.widthCell, this.widthCell);
    } else {
      console.log('KEY NOT PRINTED');
    }
  }

  randomGridLoop() {
    let isBlank = false;
    while(!isBlank){
      let cols = this.grid[0].length;
      let rows = this.grid.length;
      let posX = Math.floor(Math.random() * (cols - 1));
      let posY = Math.floor(Math.random() * (rows - 1));
      if (this.grid[posY][posX] === '') {
        isBlank = true;
        let positionArray = [];
        positionArray.push(posY, posX);
        return positionArray;
      }
    }
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

  // ----------------- CHECK COLLISIONS ------------------
  checkCollision( x, y ) {
    let x1 = Math.floor(x + 1 / this.widthCell), 
        y1 = Math.floor(y + 1 / this.widthCell),
        x2 = Math.floor(x + 1 - 1 / this.widthCell), 
        y2 = Math.floor(y + 1 - 1 / this.widthCell);

    if (this.grid[y1][x1] === 'K' || this.grid[y2][x1] === 'K' || this.grid[y1][x2] === 'K' || this.grid[y2][x2] === 'K') {
      console.log('You win');
      this.onGameOver(); // POSAR EN FUNCIÓ A ASSIGNCONTROLS AMB SWITCH-CASE I UN ELSE DESPRÉS DE DETECTAR COLISIÓ
      return true;  
    } else if (this.grid[y1][x1] !== '' || this.grid[y2][x1] !== '' || this.grid[y1][x2] !== '' || this.grid[y2][x2] !== '') {
      return true; // Collision
    }
    return false;
  }

  // --------------- PLAYER FUNCTIONS ------------------
  drawPlayer () {
    this.ctx.fillStyle = 'red';
    this.ctx.fillRect(this.player.positionX, this.player.positionY, this.player.height, this.player.width);
  }
  
  assignControlsToKeys () {
    document.onkeydown = (e) => {
      switch (e.keyCode) {
        case 38: //arrow up
          this.player.direction = 'up';
          if(!this.checkCollision(this.player.positionX / this.widthCell, (this.player.positionY - 10) / this.widthCell)){
            this.player.moveDirection();
          }
          break;
        case 40: //arrow down
          this.player.direction = 'down';
          if(!this.checkCollision(this.player.positionX / this.widthCell, (this.player.positionY + 10) / this.widthCell)){
            this.player.moveDirection();
          }
          break;
        case 37: //arrow left
          this.player.direction = 'left';
          if(!this.checkCollision((this.player.positionX - 10) / this.widthCell, this.player.positionY / this.widthCell)){
            this.player.moveDirection();
          }
          break;
        case 39: //arrow right
          this.player.direction = 'right';
          if(!this.checkCollision((this.player.positionX + 10) / this.widthCell, this.player.positionY / this.widthCell)){
            this.player.moveDirection();
          }
          break; 
        // case 80: // p pause
        //   this.snake.intervalId ? this.snake.stop() : this.snake.start()
        //   break;
      }
    };
  }

  // ----------------- INITIALIZING GAME AND UPDATING CANVAS ------------------

  start() {
    this.assignControlsToKeys();
    this.update();
  }

  update() {
    this.clear();
    this.drawBoard();
    this.drawBricks();
    this.drawPlayer();
    this.drawKey();
    this.intervalGame = window.requestAnimationFrame(this.update.bind(this));
  }

  clear() {
    this.ctx.clearRect(0, 0, this.columns * this.widthCell, this.rows * this.widthCell);
  }

}