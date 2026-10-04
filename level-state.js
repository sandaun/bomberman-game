class LevelState {
  constructor(config) {
    this.columns = config.columns;
    this.rows = config.rows;
    this.levelNumber = config.levelNumber;
    this.breakableCount = Math.min(16 + (this.levelNumber - 1) * 3, 40);
    this.grid = this.createGrid();
    // Keep two complete escape routes open around the starting pillar.
    this.safeTiles = new Set(['1,1', '1,2', '1,3', '2,1', '2,3', '3,1', '3,2', '3,3']);
    this.doorPosition = null;
    this.doorRevealed = false;
    this.doorOpen = false;

    this.buildWalls();
    this.buildBreakables();
    this.hideDoor();
    this.hidePowerups();
  }

  createGrid() {
    return Array.from({ length: this.rows }, () =>
      Array.from({ length: this.columns }, () => ({
        type: TILE_TYPES.EMPTY,
        hiddenContent: HIDDEN_CONTENT.NONE,
      }))
    );
  }

  buildWalls() {
    for (let row = 0; row < this.rows; row += 1) {
      for (let col = 0; col < this.columns; col += 1) {
        const isBorder =
          row === 0 ||
          col === 0 ||
          row === this.rows - 1 ||
          col === this.columns - 1;
        const isInnerPillar = row % 2 === 0 && col % 2 === 0;

        if (isBorder || isInnerPillar) {
          this.grid[row][col].type = TILE_TYPES.WALL;
        }
      }
    }
  }

  buildBreakables() {
    const candidates = this.shuffle(this.getTilesByType(TILE_TYPES.EMPTY))
      .filter(({ row, col }) => !this.safeTiles.has(`${row},${col}`));
    candidates.slice(0, this.breakableCount).forEach(({ row, col }) => {
      this.grid[row][col].type = TILE_TYPES.BREAKABLE;
    });
  }

  hideDoor() {
    const breakables = this.getTilesByType(TILE_TYPES.BREAKABLE);
    const candidate = breakables[Math.floor(Math.random() * breakables.length)];

    if (!candidate) {
      return;
    }

    this.grid[candidate.row][candidate.col].hiddenContent = HIDDEN_CONTENT.DOOR;
    this.doorPosition = candidate;
  }

  hidePowerups() {
    const hiddenTiles = this.shuffle(this.getTilesByType(TILE_TYPES.BREAKABLE)).filter(
      ({ row, col }) =>
        this.grid[row][col].hiddenContent === HIDDEN_CONTENT.NONE
    );

    [HIDDEN_CONTENT.POWERUP_BOMB, HIDDEN_CONTENT.POWERUP_RANGE].forEach(
      (content, index) => {
        const candidate = hiddenTiles[index];
        if (!candidate) {
          return;
        }
        this.grid[candidate.row][candidate.col].hiddenContent = content;
      }
    );
  }

  getEnemySpawnTiles(count) {
    if (count <= 0) {
      return [];
    }
    const candidates = this.shuffle(this.getTilesByType(TILE_TYPES.EMPTY)).filter(
      ({ row, col }) =>
        !this.safeTiles.has(`${row},${col}`) && row + col > 8 &&
        Object.values(DIRECTION_VECTORS).some((vector) =>
          this.isWalkable(row + vector.row, col + vector.col)
        )
    );
    const spawns = [];
    for (const tile of candidates) {
      const separated = spawns.every((spawn) =>
        Math.abs(spawn.row - tile.row) + Math.abs(spawn.col - tile.col) >= 3
      );
      if (separated) {
        spawns.push(tile);
      }
      if (spawns.length === count) {
        break;
      }
    }
    return spawns;
  }

  getTilesByType(type) {
    const tiles = [];

    for (let row = 0; row < this.rows; row += 1) {
      for (let col = 0; col < this.columns; col += 1) {
        if (this.grid[row][col].type === type) {
          tiles.push({ row, col });
        }
      }
    }

    return tiles;
  }

  isInside(row, col) {
    return row >= 0 && row < this.rows && col >= 0 && col < this.columns;
  }

  getTile(row, col) {
    if (!this.isInside(row, col)) {
      return null;
    }
    return this.grid[row][col];
  }

  isWalkable(row, col) {
    const tile = this.getTile(row, col);
    if (!tile) {
      return false;
    }

    return [
      TILE_TYPES.EMPTY,
      TILE_TYPES.POWERUP_BOMB,
      TILE_TYPES.POWERUP_RANGE,
      TILE_TYPES.DOOR_CLOSED,
      TILE_TYPES.DOOR_OPEN,
    ].includes(tile.type);
  }

  destroyBreakable(row, col) {
    const tile = this.getTile(row, col);
    if (!tile || tile.type !== TILE_TYPES.BREAKABLE) {
      return { destroyed: false, revealed: null };
    }

    let revealed = null;
    tile.type = TILE_TYPES.EMPTY;

    if (tile.hiddenContent === HIDDEN_CONTENT.DOOR) {
      tile.type = TILE_TYPES.DOOR_CLOSED;
      this.doorRevealed = true;
      revealed = HIDDEN_CONTENT.DOOR;
    }

    if (tile.hiddenContent === HIDDEN_CONTENT.POWERUP_BOMB) {
      tile.type = TILE_TYPES.POWERUP_BOMB;
      revealed = HIDDEN_CONTENT.POWERUP_BOMB;
    }

    if (tile.hiddenContent === HIDDEN_CONTENT.POWERUP_RANGE) {
      tile.type = TILE_TYPES.POWERUP_RANGE;
      revealed = HIDDEN_CONTENT.POWERUP_RANGE;
    }

    tile.hiddenContent = HIDDEN_CONTENT.NONE;
    return { destroyed: true, revealed };
  }

  collectPowerup(row, col) {
    const tile = this.getTile(row, col);
    if (!tile) {
      return null;
    }

    if (tile.type === TILE_TYPES.POWERUP_BOMB) {
      tile.type = TILE_TYPES.EMPTY;
      return HIDDEN_CONTENT.POWERUP_BOMB;
    }

    if (tile.type === TILE_TYPES.POWERUP_RANGE) {
      tile.type = TILE_TYPES.EMPTY;
      return HIDDEN_CONTENT.POWERUP_RANGE;
    }

    return null;
  }

  openDoor() {
    if (!this.doorRevealed || !this.doorPosition) {
      return false;
    }

    const tile = this.getTile(this.doorPosition.row, this.doorPosition.col);
    if (!tile) {
      return false;
    }

    tile.type = TILE_TYPES.DOOR_OPEN;
    this.doorOpen = true;
    return true;
  }

  shuffle(items) {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
    }
    return copy;
  }
}

window.LevelState = LevelState;
