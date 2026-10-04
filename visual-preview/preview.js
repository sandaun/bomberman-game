class OriginalPreviewRenderer extends Renderer {
  drawBackground() {
    this.ctx.fillStyle = '#41ae41';
    this.ctx.fillRect(0, 0, this.columns * this.cellSize, this.rows * this.cellSize);
  }

  drawTiles(level) {
    for (let row = 0; row < level.rows; row += 1) {
      for (let col = 0; col < level.columns; col += 1) {
        const type = level.getTile(row, col).type;
        const x = col * this.cellSize;
        const y = row * this.cellSize;
        if (type === TILE_TYPES.WALL) {
          this.ctx.drawImage(this.assetStore.get('board.wall'), x, y, this.cellSize, this.cellSize);
        } else if (type === TILE_TYPES.BREAKABLE) {
          this.ctx.drawImage(this.assetStore.get('board.breakable'), x + 2, y + 2, this.cellSize - 4, this.cellSize - 4);
        } else if (type === TILE_TYPES.POWERUP_BOMB) {
          this.drawPowerupTile(x, y, type);
        } else if (type === TILE_TYPES.POWERUP_RANGE) {
          this.drawPowerupTile(x, y, type);
        }
      }
    }
  }

  render(scene) {
    this.ctx.imageSmoothingEnabled = true;
    this.clear();
    this.drawBackground();
    this.drawTiles(scene.level);
    this.drawBombs(scene.bombSystem.bombs);
    this.drawEnemies(scene.enemies, scene.time);
    this.drawPlayer(scene.player, scene.time);
  }
}

async function bootPreview() {
  const manifest = structuredClone(ASSET_MANIFEST);
  manifest.board.wall = 'images/brick.png';
  manifest.board.breakable = 'images/wood.png';
  function prefixPaths(value) {
    for (const key of Object.keys(value)) {
      if (typeof value[key] === 'string') value[key] = '../' + value[key];
      else prefixPaths(value[key]);
    }
  }
  prefixPaths(manifest);
  const assets = new AssetStore(manifest);
  await assets.loadAll();
  const canvas = document.getElementById('board');
  const ctx = canvas.getContext('2d');
  const config = { ctx, assetStore: assets, cellSize: 50, columns: 15, rows: 13 };
  const currentRenderer = new OriginalPreviewRenderer(config);
  const proposedRenderer = new Renderer(config);
  const textures = createBoardTextures();
  const level = new LevelState({ columns: 15, rows: 13, levelNumber: 1 });
  level.grid.forEach((row) => row.forEach((tile) => {
    if (tile.type !== TILE_TYPES.WALL) tile.type = TILE_TYPES.EMPTY;
    tile.hiddenContent = HIDDEN_CONTENT.NONE;
  }));
  for (const [row, col] of [[1, 4], [1, 9], [3, 7], [3, 11], [5, 1], [5, 6], [5, 11], [7, 3], [7, 6], [9, 5], [9, 9], [9, 12], [11, 3], [11, 8]]) {
    level.grid[row][col].type = TILE_TYPES.BREAKABLE;
  }
  level.grid[5][3].type = TILE_TYPES.POWERUP_BOMB;
  level.grid[9][11].type = TILE_TYPES.POWERUP_RANGE;
  const player = new PlayerController({ cellSize: 50 });
  player.spawnAt({ row: 3, col: 3 });
  const enemies = [
    new EnemyController({ cellSize: 50, levelNumber: 1, spawnTile: { row: 5, col: 9 } }),
    new EnemyController({ cellSize: 50, levelNumber: 1, spawnTile: { row: 9, col: 3 }, behavior: 'chaser' }),
  ];
  const bombSystem = new BombSystem();
  bombSystem.bombs.push({ row: 3, col: 5, range: 1, fuse: 2.3, maxFuse: 2.3 });
  const scene = { level, player, enemies, bombSystem, feedback: [], time: 0 };

  function render(proposed) {
    ctx.imageSmoothingEnabled = !proposed;
    (proposed ? proposedRenderer : currentRenderer).render(scene);
    for (const id of ['current', 'proposed']) {
      document.getElementById(id).setAttribute('aria-pressed', String(proposed === (id === 'proposed')));
    }
    const materials = proposed
      ? [textures.ground[0], textures.wall, textures.breakable]
      : [null, assets.get('board.wall'), assets.get('board.breakable')];
    ['ground', 'stone', 'wood'].forEach((id, index) => {
      const swatch = document.getElementById(id).getContext('2d');
      swatch.imageSmoothingEnabled = !proposed;
      swatch.clearRect(0, 0, 100, 100);
      if (materials[index]) swatch.drawImage(materials[index], 0, 0, 100, 100);
      else { swatch.fillStyle = '#41ae41'; swatch.fillRect(0, 0, 100, 100); }
    });
  }
  document.getElementById('current').onclick = () => render(false);
  document.getElementById('proposed').onclick = () => render(true);
  render(true);
}

bootPreview();
