class Renderer {
  constructor(config) {
    this.ctx = config.ctx;
    this.assetStore = config.assetStore;
    this.cellSize = config.cellSize;
    this.columns = config.columns;
    this.rows = config.rows;
    this.boardTextures = null;
    this.background = null;
    this.enemyNESImage = null;
    this.reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
  }

  render(scene) {
    this.ctx.imageSmoothingEnabled = false;
    this.clear();
    this.drawBackground();
    this.drawTiles(scene.level);
    this.drawExplosions(scene.bombSystem.explosions);
    this.drawBombs(scene.bombSystem.bombs);
    this.drawEnemies(scene.enemies, scene.time);
    this.drawPlayer(scene.player, scene.time);
    this.drawFeedback(scene.feedback || []);
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
    if (!this.background) {
      this.boardTextures = createBoardTextures();
      this.background = document.createElement('canvas');
      this.background.width = this.columns * this.cellSize;
      this.background.height = this.rows * this.cellSize;
      const ctx = this.background.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      for (let row = 0; row < this.rows; row += 1) {
        for (let col = 0; col < this.columns; col += 1) {
          const texture = this.boardTextures.ground[(row * 3 + col) % this.boardTextures.ground.length];
          ctx.drawImage(texture, col * this.cellSize, row * this.cellSize, this.cellSize, this.cellSize);
        }
      }
    }
    this.ctx.drawImage(this.background, 0, 0);
  }

  drawTiles(level) {
    const wallImage = this.boardTextures.wall;
    const breakableImage = this.boardTextures.breakable;
    const doorImage = this.assetStore.get('board.door');

    for (let row = 0; row < level.rows; row += 1) {
      for (let col = 0; col < level.columns; col += 1) {
        const tile = level.getTile(row, col);
        const x = col * this.cellSize;
        const y = row * this.cellSize;

        if (
          [TILE_TYPES.WALL, TILE_TYPES.BREAKABLE].includes(tile.type) &&
          level.isWalkable(row + 1, col)
        ) {
          this.ctx.fillStyle = '#368341';
          this.ctx.fillRect(x + 2, y + this.cellSize, this.cellSize - 4, 4);
        }

        if (tile.type === TILE_TYPES.WALL) {
          this.ctx.drawImage(wallImage, x, y, this.cellSize, this.cellSize);
        }

        if (tile.type === TILE_TYPES.BREAKABLE) {
          this.ctx.drawImage(
            breakableImage,
            x,
            y,
            this.cellSize,
            this.cellSize
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
          this.drawPowerupTile(x, y, tile.type);
        }

        if (tile.type === TILE_TYPES.POWERUP_RANGE) {
          this.drawPowerupTile(x, y, tile.type);
        }
      }
    }
  }

  drawPowerupTile(x, y, type) {
    const sheet = this.assetStore.get('items.sheet');
    const definition = SPRITE_DEFINITIONS.powerup;
    const frame = definition.frames[type];
    if (!sheet?.complete || !frame) {
      return;
    }
    const drawSize = this.cellSize * definition.drawScale;
    const offset = (this.cellSize - drawSize) / 2;
    this.ctx.drawImage(
      sheet,
      frame.x,
      frame.y,
      definition.frameWidth,
      definition.frameHeight,
      x + offset,
      y + offset,
      drawSize,
      drawSize
    );
  }

  drawPlayer(player, time) {
    const sprite = this.assetStore.get('characters.player');
    if (!sprite?.complete || player.state === ENTITY_STATES.DEAD) {
      return;
    }

    const definition = SPRITE_DEFINITIONS.player;
    if (player.state === ENTITY_STATES.DYING) {
      this.drawDeathSprite(player, sprite, definition);
      return;
    }

    const animations = definition.animations[player.direction];
    const animationName = player.isMoving() ? 'walk' : 'idle';
    const frames = animations[animationName];
    const frameIndex = player.isMoving() ? Math.floor(time / 140) % frames.length : 0;
    const frame = frames[frameIndex];
    const drawSize = this.cellSize * definition.drawScale;
    const offset = (this.cellSize - drawSize) / 2;

    this.ctx.save();

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

  getEnemyImage(key) {
    const source = this.assetStore.get(key);
    if (key !== 'characters.enemyNES' || !source?.complete) return source;
    if (!this.enemyNESImage) {
      const canvas = document.createElement('canvas');
      canvas.width = source.naturalWidth;
      canvas.height = source.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(source, 0, 0);
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
      // The unchanged source sheet uses two green background colors.
      for (let index = 0; index < pixels.data.length; index += 4) {
        const [red, green, blue] = pixels.data.subarray(index, index + 3);
        if (blue === 0 && ((red === 12 && green === 72) || (red === 56 && green === 135))) {
          pixels.data[index + 3] = 0;
        }
      }
      ctx.putImageData(pixels, 0, 0);
      this.enemyNESImage = canvas;
    }
    return this.enemyNESImage;
  }

  drawEnemies(enemies, time) {
    enemies.forEach((enemy) => {
      if (!enemy.isActive()) return;
      const definition = ENEMY_SPRITES[enemy.species];
      const key = enemy.state === ENTITY_STATES.DYING
        ? definition.deathSpriteKey || definition.spriteKey
        : definition.spriteKey;
      if (!this.assetStore.get(key)?.complete) return;
      const sprite = this.getEnemyImage(key);
      if (enemy.state === ENTITY_STATES.DYING) {
        this.drawDeathSprite(enemy, sprite, definition);
        return;
      }
      const frameIndex = Math.floor(time / 180) % definition.frames.length;
      const frame = definition.frames[frameIndex];
      const drawSize = this.cellSize * definition.drawScale;
      const offset = (this.cellSize - drawSize) / 2;
      this.ctx.drawImage(
        sprite,
        frame.x, frame.y, definition.frameWidth, definition.frameHeight,
        enemy.renderPosition.x + offset, enemy.renderPosition.y + offset + 1,
        drawSize, drawSize
      );
    });
  }

  drawDeathSprite(entity, sprite, definition) {
    const progress = 1 - entity.deathTimer / definition.deathDuration;
    const frameIndex = Math.min(
      definition.deathFrames.length - 1,
      Math.max(0, Math.floor(progress * definition.deathFrames.length))
    );
    const frame = definition.deathFrames[frameIndex];
    const height = this.cellSize * definition.drawScale;
    const width = height * definition.deathFrameWidth / definition.deathFrameHeight;
    const offsetY = entity.type === 'player' ? -2 : 1;
    this.ctx.drawImage(
      sprite,
      frame.x,
      frame.y,
      definition.deathFrameWidth,
      definition.deathFrameHeight,
      entity.renderPosition.x + (this.cellSize - width) / 2,
      entity.renderPosition.y + (this.cellSize - height) / 2 + offsetY,
      width,
      height
    );
  }

  drawFeedback(effects) {
    effects.forEach((effect) => {
      const progress = 1 - effect.timer / effect.duration;
      const centerX = effect.x + this.cellSize / 2;
      const centerY = effect.y + this.cellSize / 2;
      this.ctx.save();
      this.ctx.globalAlpha = 1 - progress;

      if (effect.type === 'breakable') {
        // Small wood chips stay local so the explosion remains readable.
        const spread = this.cellSize * (this.reducedMotion ? 0.2 : 0.18 + progress * 0.45);
        for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
          this.ctx.fillStyle = '#6d3f22';
          this.ctx.fillRect(centerX + dx * spread - 4, centerY + dy * spread - 4, 8, 8);
          this.ctx.fillStyle = '#e8b878';
          this.ctx.fillRect(centerX + dx * spread - 2, centerY + dy * spread - 2, 4, 4);
        }
      } else {
        const rise = this.reducedMotion ? 0 : progress * 18;
        const width = effect.label.length * 7 + 12;
        const x = Math.max(
          width / 2 + 2,
          Math.min(centerX, this.columns * this.cellSize - width / 2 - 2)
        );
        const y = Math.max(12, centerY - this.cellSize * 0.6 - rise);
        this.ctx.fillStyle = '#102027';
        this.ctx.fillRect(x - width / 2, y - 10, width, 20);
        this.ctx.fillStyle = effect.color;
        this.ctx.font = 'bold 11px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(effect.label, x, y);
      }

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
    const bodyFrame = phase < 0.35 ? { x: 80, y: 48 } : { x: 96, y: 48 };
    const tipFrame = phase < 0.35 ? { x: 0, y: 32 } : { x: 48, y: 32 };
    const centerFrames = [
      { x: 48, y: 0 },
      { x: 0, y: 16 },
      { x: 16, y: 16 },
      { x: 32, y: 16 },
      { x: 48, y: 16 },
    ];
    const centerIndex = Math.min(
      centerFrames.length - 1,
      Math.max(0, Math.floor(phase * centerFrames.length))
    );
    const centerFrame = centerFrames[centerIndex];

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
