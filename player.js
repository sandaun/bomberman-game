class PlayerController {
  constructor(config) {
    this.cellSize = config.cellSize;
    this.moveSpeed = config.moveSpeed || 280;
    this.type = 'player';
    this.resetForNewGame();
  }

  resetForNewGame() {
    this.maxBombs = 1;
    this.bombRange = 1;
    this.activeBombs = 0;
    this.spawnAt({ row: 1, col: 1 });
    this.direction = 'down';
    this.state = ENTITY_STATES.IDLE;
    this.deathTimer = 0;
  }

  prepareForLevel(spawnTile) {
    this.activeBombs = 0;
    this.spawnAt(spawnTile);
    this.direction = 'down';
    this.state = ENTITY_STATES.IDLE;
    this.deathTimer = 0;
  }

  spawnAt(tile) {
    this.gridPosition = { row: tile.row, col: tile.col };
    this.previousGridPosition = { row: tile.row, col: tile.col };
    this.renderPosition = this.gridToPixels(tile);
    this.travelProgress = 1;
  }

  gridToPixels(tile) {
    return {
      x: tile.col * this.cellSize,
      y: tile.row * this.cellSize,
    };
  }

  isMoving() {
    return this.state === ENTITY_STATES.WALKING;
  }

  getBombPlacementTile() {
    if (!this.isMoving()) {
      return { ...this.gridPosition };
    }

    return this.travelProgress < 0.5
      ? { ...this.previousGridPosition }
      : { ...this.gridPosition };
  }

  canAct() {
    return this.state !== ENTITY_STATES.DYING && this.state !== ENTITY_STATES.DEAD;
  }

  tryMove(direction, level, bombSystem) {
    if (!this.canAct() || this.isMoving()) {
      return false;
    }

    this.direction = direction;
    const vector = DIRECTION_VECTORS[direction];
    const nextTile = {
      row: this.gridPosition.row + vector.row,
      col: this.gridPosition.col + vector.col,
    };

    if (!level.isWalkable(nextTile.row, nextTile.col)) {
      return false;
    }

    if (bombSystem.isBlockingTile(nextTile.row, nextTile.col)) {
      return false;
    }

    this.previousGridPosition = { ...this.gridPosition };
    this.gridPosition = nextTile;
    this.travelProgress = 0;
    this.state = ENTITY_STATES.WALKING;
    return true;
  }

  update(deltaTime) {
    if (this.state === ENTITY_STATES.DYING) {
      this.deathTimer = Math.max(0, this.deathTimer - deltaTime);
      if (this.deathTimer === 0) {
        this.state = ENTITY_STATES.DEAD;
      }
      return;
    }

    if (!this.isMoving()) {
      this.renderPosition = this.gridToPixels(this.gridPosition);
      return;
    }

    const progressStep = (this.moveSpeed * deltaTime) / this.cellSize;
    this.travelProgress = Math.min(1, this.travelProgress + progressStep);

    const start = this.gridToPixels(this.previousGridPosition);
    const target = this.gridToPixels(this.gridPosition);

    this.renderPosition = {
      x: start.x + (target.x - start.x) * this.travelProgress,
      y: start.y + (target.y - start.y) * this.travelProgress,
    };

    if (this.travelProgress >= 1) {
      this.state = ENTITY_STATES.IDLE;
      this.renderPosition = target;
    }
  }

  kill() {
    if (!this.canAct()) {
      return;
    }

    this.state = ENTITY_STATES.DYING;
    this.deathTimer = 0.55;
  }

  addBombCapacity() {
    this.maxBombs += 1;
  }

  addRange() {
    this.bombRange += 1;
  }
}

window.PlayerController = PlayerController;
