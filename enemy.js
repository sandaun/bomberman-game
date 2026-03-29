class EnemyController {
  constructor(config) {
    this.cellSize = config.cellSize;
    this.baseSpeed = config.baseSpeed || 165;
    this.type = 'enemy';
    this.direction = 'left';
    this.state = ENTITY_STATES.IDLE;
    this.spawnAt(config.spawnTile);
    this.moveSpeed = this.baseSpeed + config.levelNumber * 12;
    this.deathTimer = 0;
  }

  spawnAt(tile) {
    this.gridPosition = { row: tile.row, col: tile.col };
    this.previousGridPosition = { row: tile.row, col: tile.col };
    this.renderPosition = {
      x: tile.col * this.cellSize,
      y: tile.row * this.cellSize,
    };
    this.travelProgress = 1;
  }

  isActive() {
    return this.state !== ENTITY_STATES.DEAD;
  }

  isMoving() {
    return this.state === ENTITY_STATES.WALKING;
  }

  update(deltaTime, level, bombSystem) {
    if (this.state === ENTITY_STATES.DYING) {
      this.deathTimer = Math.max(0, this.deathTimer - deltaTime);
      if (this.deathTimer === 0) {
        this.state = ENTITY_STATES.DEAD;
      }
      return;
    }

    if (this.isMoving()) {
      this.updateMovement(deltaTime);
      return;
    }

    const nextDirection = this.chooseDirection(level, bombSystem);
    if (!nextDirection) {
      return;
    }

    this.beginMove(nextDirection);
  }

  updateMovement(deltaTime) {
    const progressStep = (this.moveSpeed * deltaTime) / this.cellSize;
    this.travelProgress = Math.min(1, this.travelProgress + progressStep);

    const start = {
      x: this.previousGridPosition.col * this.cellSize,
      y: this.previousGridPosition.row * this.cellSize,
    };
    const target = {
      x: this.gridPosition.col * this.cellSize,
      y: this.gridPosition.row * this.cellSize,
    };

    this.renderPosition = {
      x: start.x + (target.x - start.x) * this.travelProgress,
      y: start.y + (target.y - start.y) * this.travelProgress,
    };

    if (this.travelProgress >= 1) {
      this.state = ENTITY_STATES.IDLE;
      this.renderPosition = target;
    }
  }

  chooseDirection(level, bombSystem) {
    const availableDirections = Object.entries(DIRECTION_VECTORS)
      .filter(([, vector]) => {
        const nextRow = this.gridPosition.row + vector.row;
        const nextCol = this.gridPosition.col + vector.col;

        if (!level.isWalkable(nextRow, nextCol)) {
          return false;
        }

        return !bombSystem.isBlockingTile(nextRow, nextCol);
      })
      .map(([direction]) => direction);

    if (!availableDirections.length) {
      return null;
    }

    const filteredDirections =
      availableDirections.length > 1
        ? availableDirections.filter(
            (direction) => direction !== OPPOSITE_DIRECTIONS[this.direction]
          )
        : availableDirections;

    if (filteredDirections.includes(this.direction) && Math.random() < 0.55) {
      return this.direction;
    }

    const index = Math.floor(Math.random() * filteredDirections.length);
    return filteredDirections[index];
  }

  beginMove(direction) {
    const vector = DIRECTION_VECTORS[direction];
    this.direction = direction;
    this.previousGridPosition = { ...this.gridPosition };
    this.gridPosition = {
      row: this.gridPosition.row + vector.row,
      col: this.gridPosition.col + vector.col,
    };
    this.travelProgress = 0;
    this.state = ENTITY_STATES.WALKING;
  }

  kill() {
    if (this.state === ENTITY_STATES.DYING || this.state === ENTITY_STATES.DEAD) {
      return;
    }

    this.state = ENTITY_STATES.DYING;
    this.deathTimer = 0.45;
  }
}

window.EnemyController = EnemyController;
