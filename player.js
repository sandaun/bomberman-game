class Player {
  constructor(maxColumns, maxRows, widthCell) {
    this.widthCell = widthCell; // Cell size if needed
    this.positionX = widthCell; // Player position initial. As a cell its 50x50 I can use widthCell to mark the position
    this.positionY = widthCell; // Player position initial. As a cell its 50x50 I can use widthCell to mark the position
    this.height = 50;
    this.width = 50;
    this.direction = 'down';
    this.intervalId = undefined;
    this.maxRows = maxRows;
    this.maxColumns = maxColumns;
    this.bombRange = 1; // Range cells for the bomb when explotes
    this.playerIsHit = false;
    this.isMoving = false; // Indica si el player es mou

    // Sprite del jugador
    this.playerSprite = new Image();
    this.playerSprite.src = 'images/BombermanPlayers.png'; // Ruta del sprite
    this.playerWidthFrame = 18; // Amplada real del frame del player
    this.playerHeightFrame = 22; // Alçada real del frame del player
    this.playerCurrentFrame = 0; // Frame inicial del player
    this.playerFrameCount = 3; // Frames per direcció
    this.playerSrcX = 4; // Coordenada X inicial del frame del player
    this.playerSrcY = 4; // Coordenada Y inicial del frame del player

    this.playerLastFrameTime = 0; // Temps de l'últim canvi de frame del player
    this.playerFrameInterval = 250; // Interval entre frames del player (ms)

    // Sprite de la bomba
    this.bombSprite = new Image();
    this.bombSprite.src = 'images/BombermanBombsExplosions.png'; // Sprite amb moviment i explosions
    this.bombSpriteWidth = 128; // Amplada total del sprite
    this.bombSpriteHeight = 64; // Alçada total del sprite
    this.bombCols = 8; // Columnes
    this.bombRows = 4; // Files
    this.bombWidthFrame = 16; // Amplada d'un frame
    this.bombHeightFrame = 16; // Alçada d'un frame
    this.bombCurrentFrame = 0; // Frame inicial
    this.bombFrameStart = 0; // Inici del moviment (0,0)
    this.bombFrameEnd = 2; // Final del moviment (32,0)
    this.bombSrcX = 0; // Coordenada X inicial
    this.bombSrcY = 0; // Coordenada Y inicial (primera fila)
    this.isExploding = false; // Estat inicial de l'explosió
  }

  getSpriteCoordinates() {
    const frames = {
      down: this.isMoving
        ? [
            // Moviment cap avall
            { x: 30, y: 5 }, // Moviment 1
            { x: 56, y: 5 }, // Moviment 2
          ]
        : [
            // Parat cap avall
            { x: 4, y: 5 }, // Parat
          ],
      left: this.isMoving
        ? [
            // Moviment cap a l'esquerra
            { x: 107, y: 5 }, // Moviment 1
            { x: 132, y: 5 }, // Moviment 2
          ]
        : [
            // Parat cap a l'esquerra
            { x: 83, y: 5 }, // Parat
          ],
      up: this.isMoving
        ? [
            // Moviment cap amunt
            { x: 183, y: 5 }, // Moviment 1
            { x: 208, y: 5 }, // Moviment 2
          ]
        : [
            // Parat cap amunt
            { x: 157, y: 5 }, // Parat
          ],
      right: this.isMoving
        ? [
            // Moviment cap a la dreta (mirall del moviment esquerra)
            { x: 107, y: 5 }, // Moviment 1 (mirall)
            { x: 132, y: 5 }, // Moviment 2 (mirall)
          ]
        : [
            // Parat cap a la dreta (mirall)
            { x: 83, y: 5 }, // Parat (mirall)
          ],
    };

    return frames[this.direction];
  }

  updateBombFrame(ctx, x, y, currentTime) {
    if (!this.lastFrameTime) this.lastFrameTime = currentTime;

    // Comprova si ha passat prou temps per canviar de frame
    if (currentTime - this.lastFrameTime > 150) {
      if (!this.isExploding) {
        // Actualitza els frames de moviment de la bomba
        this.bombCurrentFrame =
          (this.bombCurrentFrame + 1) % (this.bombFrameEnd + 1);
        this.bombSrcX = this.bombCurrentFrame * this.bombWidthFrame;
        this.bombSrcY = 0; // Primera fila
      }

      this.lastFrameTime = currentTime; // Actualitza el temps de l'últim canvi de frame
    }

    // Dibuixa la bomba al canvas
    ctx.drawImage(
      this.bombSprite,
      this.bombSrcX,
      this.bombSrcY,
      this.bombWidthFrame,
      this.bombHeightFrame,
      x,
      y,
      this.widthCell, // Escala a 50x50
      this.widthCell
    );
  }

  updatePlayerFrame(currentTime) {
    if (currentTime - this.playerLastFrameTime > this.playerFrameInterval) {
      const frames = this.getSpriteCoordinates(); // Obté els frames per la direcció actual

      // Si es mou, alterna entre els frames de moviment
      if (this.isMoving) {
        this.playerCurrentFrame = (this.playerCurrentFrame + 1) % frames.length;
      } else {
        this.playerCurrentFrame = 0; // Parat, sempre mostra el primer frame
      }

      // Actualitza les coordenades del frame actual
      const frame = frames[this.playerCurrentFrame];
      this.playerSrcX = frame.x;
      this.playerSrcY = frame.y;

      this.playerLastFrameTime = currentTime; // Actualitza l'últim temps
    }
  }

  drawPlayer(ctx) {
    ctx.save(); // Guarda l'estat del canvas

    if (this.direction === 'right') {
      ctx.scale(-1, 1); // Aplica el mirall horitzontal
      ctx.drawImage(
        this.playerSprite,
        this.playerSrcX,
        this.playerSrcY,
        this.playerWidthFrame,
        this.playerHeightFrame, // Frame del sprite
        -this.positionX - this.width,
        this.positionY,
        this.width,
        this.height // Posició i mida (ajustem X per compensar el mirall)
      );
    } else {
      ctx.drawImage(
        this.playerSprite,
        this.playerSrcX,
        this.playerSrcY,
        this.playerWidthFrame,
        this.playerHeightFrame, // Frame del sprite
        this.positionX,
        this.positionY,
        this.width,
        this.height // Posició i mida
      );
    }

    ctx.restore(); // Restaura l'estat del canvas
  }

  moveDirection() {
    this.isMoving = true; // El player es mou

    switch (this.direction) {
      case 'up':
        this.positionY -= 10;
        break;
      case 'down':
        this.positionY += 10;
        break;
      case 'left':
        this.positionX -= 10;
        break;
      case 'right':
        this.positionX += 10;
        break;
    }
  }

  // This function calculates player position (column and row) and returns a position array where to throw
  // the bomb depending on the player direction. TO IMPROVE: just make player turn itself first and not move.
  throwBomb() {
    let { playerRightSide, playerLeftSide, playerUpSide, playerDownSide } =
      this.playerSideBySide();
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
        break;
    }
    return bombGridPosition;
  }

  // This function calculates if player is within the range of the bomb explosion in any of the 4 sides. If it is, player is killed (true).
  bombVsPlayerPosition(bombPosition) {
    let { playerRightSide, playerLeftSide, playerUpSide, playerDownSide } =
      this.playerSideBySide();

    let bombUp = [bombPosition[0] - this.bombRange, bombPosition[1]];
    let bombDown = [bombPosition[0] + this.bombRange, bombPosition[1]];
    let bombLeft = [bombPosition[0], bombPosition[1] - this.bombRange];
    let bombRight = [bombPosition[0], bombPosition[1] + this.bombRange];

    // First if condition checks if player is just in one tile (so x1 x2 are equal, y1 y2 are equal).
    // Second if condition (else if) checks when player can be in two different tiles in X axis (so x1 and x2 are different) or when
    // player can be in two different tiles in y axis (y1 and y2 are different). Then compares this to the different bomb range positions.
    if (playerLeftSide === playerRightSide && playerDownSide === playerUpSide) {
      if (
        (playerUpSide === bombUp[0] && playerLeftSide === bombUp[1]) ||
        (playerUpSide === bombDown[0] && playerLeftSide === bombDown[1]) ||
        (playerUpSide === bombLeft[0] && playerLeftSide === bombLeft[1]) ||
        (playerUpSide === bombRight[0] && playerLeftSide === bombRight[1])
      ) {
        return true;
      }
    } else if (
      (playerUpSide === bombUp[0] && playerLeftSide === bombUp[1]) ||
      (playerDownSide === bombUp[0] && playerRightSide === bombUp[1]) ||
      (playerUpSide === bombDown[0] && playerLeftSide === bombDown[1]) ||
      (playerDownSide === bombDown[0] && playerRightSide === bombDown[1]) ||
      (playerUpSide === bombLeft[0] && playerLeftSide === bombLeft[1]) ||
      (playerDownSide === bombLeft[0] && playerRightSide === bombLeft[1]) ||
      (playerUpSide === bombRight[0] && playerLeftSide === bombRight[1]) ||
      (playerDownSide === bombRight[0] && playerRightSide === bombRight[1])
    ) {
      return true;
    } else {
      return false;
    }
  }

  // This function just defines the 4 player sides (left-right-up-down)
  playerSideBySide() {
    let playerLeftSide = Math.floor(
      this.positionX / this.widthCell + 1 / this.widthCell
    ); // x1
    let playerRightSide = Math.floor(
      this.positionX / this.widthCell + 1 - 1 / this.widthCell
    ); // x2
    let playerUpSide = Math.floor(
      this.positionY / this.widthCell + 1 / this.widthCell
    ); // y1
    let playerDownSide = Math.floor(
      this.positionY / this.widthCell + 1 - 1 / this.widthCell
    ); // y2
    return { playerRightSide, playerLeftSide, playerUpSide, playerDownSide };
  }
}
