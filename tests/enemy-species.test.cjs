const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { test } = require('node:test');
const context = vm.createContext({ window: {}, performance });
for (const file of ['assets.js', 'level-state.js', 'player.js', 'enemy.js', 'bomb-system.js']) {
  vm.runInContext(fs.readFileSync(file, 'utf8'), context);
}
const { EnemyController, PlayerController, LevelState, BombSystem, ENEMY_DEFINITIONS, ENEMY_SPRITES, TILE_TYPES } = context.window;
function setup(species) {
  const level = new LevelState({ columns: 15, rows: 13, levelNumber: 1 });
  for (const row of level.grid) for (const tile of row) {
    if (tile.type !== TILE_TYPES.WALL) tile.type = TILE_TYPES.EMPTY;
  }
  const enemy = new EnemyController({ species, cellSize: 50, spawnTile: { row: 3, col: 3 } });
  const player = new PlayerController({ cellSize: 50 });
  player.spawnAt({ row: 3, col: 7 });
  return { level, enemy, player, bombs: new BombSystem() };
}
function withRandom(value, callback) {
  context.Math = Object.create(Math);
  context.Math.random = () => value;
  try { callback(); } finally { delete context.Math; }
}

test('only Kondoria, Ovapi, and Pontan cross crates; no species crosses pillars, borders, or bombs', () => {
  for (const species of Object.keys(ENEMY_DEFINITIONS)) {
    const { level, enemy, bombs } = setup(species);
    level.grid[3][4].type = TILE_TYPES.BREAKABLE;
    assert.equal(enemy.canEnter(3, 4, level, bombs), ['kondoria', 'ovapi', 'pontan'].includes(species));
    assert.equal(enemy.canEnter(2, 2, level, bombs), false);
    assert.equal(enemy.canEnter(0, 3, level, bombs), false);
    assert.equal(enemy.canEnter(-1, 3, level, bombs), false);
    bombs.bombs.push({ row: 3, col: 4 });
    assert.equal(enemy.canEnter(3, 4, level, bombs), false);
  }
});

test('Ballom and Dahl ignore the player, while Onil, Minvo, and Ovapi pursue only nearby living players', () => {
  withRandom(0, () => {
    for (const species of ['ballom', 'dahl', 'onil', 'minvo', 'ovapi']) {
      const { level, enemy, player, bombs } = setup(species);
      const pursues = !['ballom', 'dahl'].includes(species);
      assert.equal(enemy.chooseDirection(level, bombs, player), pursues ? 'right' : 'left');
      player.spawnAt({ row: 3, col: 12 });
      assert.equal(enemy.chooseDirection(level, bombs, player), 'left');
      player.spawnAt({ row: 3, col: 7 }); player.kill();
      assert.equal(enemy.chooseDirection(level, bombs, player), 'left');
    }
  });
});

test('Pass finds a route around crates and bombs; Pontan and Kondoria can use the crate shortcut', () => {
  withRandom(0, () => {
    for (const species of ['pass', 'pontan', 'kondoria']) {
      const { level, enemy, player, bombs } = setup(species);
      level.grid[3][4].type = TILE_TYPES.BREAKABLE;
      assert.equal(enemy.chooseDirection(level, bombs, player), species === 'pass' ? 'up' : 'right');
      bombs.bombs.push({ row: 3, col: 4 });
      assert.equal(enemy.chooseDirection(level, bombs, player), 'up');
    }
  });
});

test('an unreachable player does not cause a trapped pursuer to move into an obstacle', () => {
  const { level, enemy, player, bombs } = setup('pass');
  for (const [row, col] of [[3, 2], [3, 4], [2, 3], [4, 3]]) level.grid[row][col].type = TILE_TYPES.BREAKABLE;
  assert.equal(enemy.findPursuitDirection(level, bombs, player.gridPosition), null);
  assert.equal(enemy.chooseDirection(level, bombs, player), null);
  enemy.update(1, level, bombs, player);
  assert.equal(enemy.gridPosition.col, 3);
});

test('each species moves at its defined speed independent of level and frame rate', () => {
  for (const species of Object.keys(ENEMY_DEFINITIONS)) {
    for (const fps of [20, 30, 60, 144]) {
      const { enemy } = setup(species);
      enemy.chooseDirection = () => 'right';
      for (let frame = 0; frame < fps; frame += 1) enemy.update(1 / fps);
      assert.ok(Math.abs(enemy.renderPosition.x - 150 - ENEMY_DEFINITIONS[species].speed) < 0.0001);
    }
  }
});

test('explosions kill wall-passing enemies inside crates and emit each original score once', () => {
  for (const [species, definition] of Object.entries(ENEMY_DEFINITIONS)) {
    const { level, enemy, player, bombs } = setup(species);
    level.grid[3][3].type = TILE_TYPES.BREAKABLE;
    bombs.bombs.push({ id: 1, row: 3, col: 2, range: 3, fuse: 0, maxFuse: 2.3 });
    const events = bombs.update(0.01, level, player, [enemy]);
    assert.equal(level.grid[3][3].type, TILE_TYPES.EMPTY);
    assert.equal(enemy.state, 'dying');
    assert.equal(events.find((event) => event.type === 'enemy-hit').score, definition.score);
    assert.equal(bombs.update(0.01, level, player, [enemy]).filter((event) => event.type === 'enemy-hit').length, 0);
    enemy.update(0.45, level, bombs, player);
    enemy.update(1, level, bombs, player);
    assert.equal(enemy.state, 'dead');
    assert.equal(enemy.gridPosition.col, 3);
  }
});

test('all species have different walking sources and complete death rectangles inside their sheets', () => {
  const sources = new Set();
  for (const [species, definition] of Object.entries(ENEMY_SPRITES)) {
    sources.add(`${definition.spriteKey}:${definition.frames[0].x},${definition.frames[0].y}`);
    const width = species === 'ballom' ? 329 : 224;
    const height = species === 'ballom' ? 526 : 383;
    for (const frame of definition.deathFrames) {
      assert.ok(frame.x >= 0 && frame.y >= 0);
      assert.ok(frame.x + definition.deathFrameWidth <= width);
      assert.ok(frame.y + definition.deathFrameHeight <= height);
    }
    if (species !== 'ballom') for (const frame of definition.frames) {
      assert.ok(frame.x + definition.frameWidth <= width);
      assert.ok(frame.y + definition.frameHeight <= height);
    }
  }
  assert.equal(sources.size, 8);
});
