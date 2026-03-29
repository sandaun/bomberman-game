class BombSystem {
  constructor() {
    this.bombs = [];
    this.explosions = [];
    this.events = [];
    this.nextBombId = 1;
  }

  reset() {
    this.bombs = [];
    this.explosions = [];
    this.events = [];
    this.nextBombId = 1;
  }

  placeBomb(player) {
    const { row, col } = player.getBombPlacementTile();

    if (player.activeBombs >= player.maxBombs || this.getBombAt(row, col)) {
      return false;
    }

    this.bombs.push({
      id: this.nextBombId,
      row,
      col,
      range: player.bombRange,
      fuse: 2.3,
      maxFuse: 2.3,
    });
    this.nextBombId += 1;
    player.activeBombs += 1;
    return true;
  }

  update(deltaTime, level, player, enemies) {
    this.events = [];
    const queue = [];

    this.bombs.forEach((bomb) => {
      bomb.fuse -= deltaTime;
      if (bomb.fuse <= 0) {
        queue.push(bomb.id);
      }
    });

    while (queue.length) {
      const bombId = queue.shift();
      const chained = this.explodeBomb(bombId, level, player);
      chained.forEach((id) => {
        if (!queue.includes(id)) {
          queue.push(id);
        }
      });
    }

    this.explosions.forEach((explosion) => {
      explosion.timer -= deltaTime;
    });
    this.explosions = this.explosions.filter((explosion) => explosion.timer > 0);

    this.applyExplosionDamage(player, enemies);
    return this.events;
  }

  explodeBomb(bombId, level, player) {
    const bombIndex = this.bombs.findIndex((bomb) => bomb.id === bombId);
    if (bombIndex === -1) {
      return [];
    }

    const [bomb] = this.bombs.splice(bombIndex, 1);
    player.activeBombs = Math.max(0, player.activeBombs - 1);

    const chainedBombIds = [];
    const tiles = this.buildExplosionTiles(bomb, level, chainedBombIds);
    this.explosions.push({
      id: `${bomb.id}-${Date.now()}`,
      tiles,
      timer: 0.45,
      duration: 0.45,
    });
    return chainedBombIds;
  }

  buildExplosionTiles(bomb, level, chainedBombIds) {
    const tiles = [{ row: bomb.row, col: bomb.col, segment: 'center' }];

    Object.entries(DIRECTION_VECTORS).forEach(([direction, vector]) => {
      for (let step = 1; step <= bomb.range; step += 1) {
        const row = bomb.row + vector.row * step;
        const col = bomb.col + vector.col * step;
        const tile = level.getTile(row, col);

        if (!tile || tile.type === TILE_TYPES.WALL) {
          break;
        }

        tiles.push({
          row,
          col,
          segment: this.getExplosionSegment(direction, step === bomb.range),
        });

        const chainedBomb = this.getBombAt(row, col);
        if (chainedBomb) {
          chainedBombIds.push(chainedBomb.id);
        }

        if (tile.type === TILE_TYPES.BREAKABLE) {
          const result = level.destroyBreakable(row, col);
          if (result.destroyed) {
            this.events.push({ type: 'breakable-destroyed' });
          }
          if (result.revealed) {
            this.events.push({ type: 'tile-revealed', revealed: result.revealed });
          }
          break;
        }
      }
    });

    return tiles;
  }

  getExplosionSegment(direction, isTip) {
    if (!isTip) {
      return direction === 'left' || direction === 'right'
        ? 'horizontal'
        : 'vertical';
    }

    return `tip-${direction}`;
  }

  applyExplosionDamage(player, enemies) {
    const dangerTiles = this.explosions.flatMap((explosion) => explosion.tiles);

    if (
      dangerTiles.some(
        (tile) =>
          tile.row === player.gridPosition.row && tile.col === player.gridPosition.col
      )
    ) {
      this.events.push({ type: 'player-hit' });
    }

    enemies.forEach((enemy) => {
      if (
        enemy.state !== ENTITY_STATES.IDLE &&
        enemy.state !== ENTITY_STATES.WALKING
      ) {
        return;
      }

      if (
        dangerTiles.some(
          (tile) =>
            tile.row === enemy.gridPosition.row && tile.col === enemy.gridPosition.col
        )
      ) {
        enemy.kill();
        this.events.push({ type: 'enemy-hit' });
      }
    });
  }

  isBlockingTile(row, col) {
    return this.bombs.some((bomb) => bomb.row === row && bomb.col === col);
  }

  getBombAt(row, col) {
    return this.bombs.find((bomb) => bomb.row === row && bomb.col === col);
  }
}

window.BombSystem = BombSystem;
