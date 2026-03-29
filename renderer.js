class Renderer {
  constructor(config) {
    this.ctx = config.ctx;
    this.assetStore = config.assetStore;
    this.cellSize = config.cellSize;
    this.columns = config.columns;
    this.rows = config.rows;
  }

  render(scene) {
    this.clear();
    this.drawBackground();
    this.drawTiles(scene.level);
    this.drawExplosions(scene.bombSystem.explosions);
    this.drawBombs(scene.bombSystem.bombs);
    this.drawEnemies(scene.enemies, scene.time);
    this.drawPlayer(scene.player, scene.time);
  }

  clear() {
    this.ctx.clearRect(
      0,
      0,
      this.columns * this.cellSize,
      this.rows * this.cellSize
    );
  }

  drawBackground() {
    this.ctx.fillStyle = '#41ae41';
    this.ctx.fillRect(
      0,
      0,
      this.columns * this.cellSize,
      this.rows * this.cellSize
    );
  }

  drawTiles(level) {
    const wallImage = this.assetStore.get('board.wall');
    const breakableImage = this.assetStore.get('board.breakable');
    const doorImage = this.assetStore.get('board.door');

    for (let row = 0; row < level.rows; row += 1) {
      for (let col = 0; col < level.columns; col += 1) {
        const tile = level.getTile(row, col);
        const x = col * this.cellSize;
        const y = row * this.cellSize;

        if (tile.type === TILE_TYPES.WALL && wallImage?.complete) {
          this.ctx.drawImage(wallImage, x, y, this.cellSize, this.cellSize);
        }

        if (tile.type === TILE_TYPES.BREAKABLE && breakableImage?.complete) {
          this.ctx.drawImage(
            breakableImage,
            x + 2,
            y + 2,
            this.cellSize - 4,
            this.cellSize - 4
          );
        }

        if (
          [TILE_TYPES.DOOR_CLOSED, TILE_TYPES.DOOR_OPEN].includes(tile.type) &&
          doorImage?.complete
        ) {
          this.ctx.save();
          this.ctx.globalAlpha = tile.type === TILE_TYPES.DOOR_OPEN ? 1 : 0.75;
          this.ctx.drawImage(
            doorImage,
            x + 4,
            y + 2,
            this.cellSize - 8,
            this.cellSize - 4
          );
          this.ctx.restore();

          if (tile.type === TILE_TYPES.DOOR_CLOSED) {
            this.ctx.fillStyle = 'rgba(20, 27, 31, 0.45)';
            this.ctx.fillRect(x + 4, y + 2, this.cellSize - 8, this.cellSize - 4);
          }
        }

        if (tile.type === TILE_TYPES.POWERUP_BOMB) {
          this.drawPowerupTile(x, y, '#ffd166', 'B');
        }

        if (tile.type === TILE_TYPES.POWERUP_RANGE) {
          this.drawPowerupTile(x, y, '#ff6b6b', 'F');
        }
      }
    }
  }

  drawPowerupTile(x, y, color, label) {
    this.ctx.fillStyle = 'rgba(16, 22, 27, 0.45)';
    this.ctx.fillRect(x + 8, y + 8, this.cellSize - 16, this.cellSize - 16);
    this.ctx.beginPath();
    this.ctx.fillStyle = color;
    this.ctx.arc(
      x + this.cellSize / 2,
      y + this.cellSize / 2,
      this.cellSize * 0.24,
      0,
      Math.PI * 2
    );
    this.ctx.fill();
    this.ctx.fillStyle = '#102027';
    this.ctx.font = 'bold 15px "Press Start 2P", monospace';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(label, x + this.cellSize / 2, y + this.cellSize / 2 + 1);
  }

  drawPlayer(player, time) {
    const sprite = this.assetStore.get('characters.player');
    if (!sprite?.complete) {
      return;
    }

    const definition = SPRITE_DEFINITIONS.player;
    const animations = definition.animations[player.direction];
    const animationName = player.isMoving() ? 'walk' : 'idle';
    const frames = animations[animationName];
    const frameIndex = player.isMoving() ? Math.floor(time / 140) % frames.length : 0;
    const frame = frames[frameIndex];
    const drawSize = this.cellSize * definition.drawScale;
    const offset = (this.cellSize - drawSize) / 2;

    this.ctx.save();
    this.ctx.globalAlpha = player.state === ENTITY_STATES.DYING ? 0.4 : 1;

    if (frame.flipX) {
      this.ctx.translate(player.renderPosition.x + this.cellSize, 0);
      this.ctx.scale(-1, 1);
      this.ctx.drawImage(
        sprite,
        frame.x,
        frame.y,
        definition.frameWidth,
        definition.frameHeight,
        offset,
        player.renderPosition.y + offset - 2,
        drawSize,
        drawSize
      );
    } else {
      this.ctx.drawImage(
        sprite,
        frame.x,
        frame.y,
        definition.frameWidth,
        definition.frameHeight,
        player.renderPosition.x + offset,
        player.renderPosition.y + offset - 2,
        drawSize,
        drawSize
      );
    }

    this.ctx.restore();
  }

  drawEnemies(enemies, time) {
    const sprite = this.assetStore.get('characters.enemy');
    if (!sprite?.complete) {
      return;
    }

    const definition = SPRITE_DEFINITIONS.enemy;

    enemies.forEach((enemy) => {
      if (!enemy.isActive()) {
        return;
      }

      const frameIndex = Math.floor(time / 180) % definition.frames.length;
      const frame = definition.frames[frameIndex];
      const drawSize = this.cellSize * definition.drawScale;
      const offset = (this.cellSize - drawSize) / 2;

      this.ctx.save();
      if (enemy.state === ENTITY_STATES.DYING) {
        this.ctx.globalAlpha = Math.max(enemy.deathTimer / 0.45, 0.15);
      }

      this.ctx.drawImage(
        sprite,
        frame.x,
        frame.y,
        definition.frameWidth,
        definition.frameHeight,
        enemy.renderPosition.x + offset,
        enemy.renderPosition.y + offset + 1,
        drawSize,
        drawSize
      );
      this.ctx.restore();
    });
  }

  drawBombs(bombs) {
    const sheet = this.assetStore.get('effects.bombSheet');
    if (!sheet?.complete) {
      return;
    }

    bombs.forEach((bomb) => {
      const progress = 1 - bomb.fuse / bomb.maxFuse;
      const elapsed = bomb.maxFuse - bomb.fuse;
      const frameStep =
        progress > 0.7 ? 0.085 : progress > 0.4 ? 0.13 : 0.18;
      const frameIndex =
        Math.floor(elapsed / frameStep) %
        SPRITE_DEFINITIONS.bomb.fuseFrames.length;
      const frame = SPRITE_DEFINITIONS.bomb.fuseFrames[frameIndex];
      const x = bomb.col * this.cellSize;
      const y = bomb.row * this.cellSize;

      this.ctx.drawImage(
        sheet,
        frame.x,
        frame.y,
        SPRITE_DEFINITIONS.bomb.frameWidth,
        SPRITE_DEFINITIONS.bomb.frameHeight,
        x,
        y,
        this.cellSize,
        this.cellSize
      );
    });
  }

  drawExplosions(explosions) {
    const sheet = this.assetStore.get('effects.bombSheet');
    if (!sheet?.complete) {
      return;
    }

    explosions.forEach((explosion) => {
      const phase = 1 - explosion.timer / explosion.duration;

      explosion.tiles.forEach((tile) => {
        const x = tile.col * this.cellSize;
        const y = tile.row * this.cellSize;
        this.drawExplosionSegment(sheet, tile.segment, x, y, phase);
      });
    });
  }

  drawExplosionSegment(sheet, segment, x, y, phase) {
    const frame = this.getExplosionFrame(segment, phase);
    this.ctx.save();
    this.ctx.translate(x + this.cellSize / 2, y + this.cellSize / 2);
    this.ctx.rotate(frame.rotation || 0);

    if (frame.flipX) {
      this.ctx.scale(-1, 1);
    }

    this.ctx.drawImage(
      sheet,
      frame.x,
      frame.y,
      SPRITE_DEFINITIONS.bomb.frameWidth,
      SPRITE_DEFINITIONS.bomb.frameHeight,
      -this.cellSize / 2,
      -this.cellSize / 2,
      this.cellSize,
      this.cellSize
    );
    this.ctx.restore();
  }

  getExplosionFrame(segment, phase) {
    const bodyFrame = phase < 0.35 ? { x: 16, y: 32 } : { x: 32, y: 32 };
    const tipFrame = phase < 0.35 ? { x: 0, y: 32 } : { x: 48, y: 32 };
    const centerFrame = phase < 0.3 ? { x: 48, y: 16 } : { x: 48, y: 0 };

    switch (segment) {
      case 'center':
        return { ...centerFrame, rotation: 0 };
      case 'horizontal':
        return { ...bodyFrame, rotation: 0 };
      case 'vertical':
        return { ...bodyFrame, rotation: Math.PI / 2 };
      case 'tip-right':
        return { ...tipFrame, rotation: 0, flipX: false };
      case 'tip-left':
        return { ...tipFrame, rotation: 0, flipX: true };
      case 'tip-up':
        return { ...tipFrame, rotation: -Math.PI / 2, flipX: false };
      case 'tip-down':
        return { ...tipFrame, rotation: Math.PI / 2, flipX: false };
      default:
        return { ...centerFrame, rotation: 0 };
    }
  }
}

window.Renderer = Renderer;
