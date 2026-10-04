const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { test } = require('node:test');
const context = vm.createContext({ window: { requestAnimationFrame: () => 1 }, performance });
for (const file of ['assets.js', 'level-state.js', 'player.js', 'enemy.js', 'bomb-system.js', 'input-manager.js', 'renderer.js', 'game.js']) {
  vm.runInContext(fs.readFileSync(file, 'utf8'), context);
}
const { LevelState, PlayerController, BombSystem, Renderer, GameController, InputManager, TILE_TYPES } = context.window;
function setup() {
  const overlays = [];
  const game = new GameController({
    canvas: {}, ctx: {}, columns: 15, rows: 13, cellSize: 50,
    assetStore: { get() {} }, input: new InputManager(),
    hud: { hideOverlay() {}, showOverlay(config) { overlays.push(config); } },
  });
  game.startLevel();
  return { game, overlays };
}
const openLevel = {
  getTile: (row, col) => row >= 0 && col >= 0 && row < 21 && col < 21 ? { type: TILE_TYPES.EMPTY } : null,
};

test('extended blasts preserve body/tip counts and approved sprite sources', () => {
  const bombs = new BombSystem();
  const renderer = new Renderer({});
  for (const range of [1, 2, 3, 5]) {
    const tiles = bombs.buildExplosionTiles({ row: 10, col: 10, range }, openLevel, []);
    assert.equal(tiles.length, 1 + range * 4);
    assert.equal(tiles.filter((tile) => tile.segment.startsWith('tip-')).length, 4);
    assert.equal(tiles.filter((tile) => tile.segment === 'horizontal').length, (range - 1) * 2);
    assert.equal(tiles.filter((tile) => tile.segment === 'vertical').length, (range - 1) * 2);
  }
  assert.equal(renderer.getExplosionFrame('center', 0).x, 48);
  assert.equal(renderer.getExplosionFrame('center', 0.4).y, 16);
  assert.equal(renderer.getExplosionFrame('horizontal', 0.2).x, 80);
  assert.equal(renderer.getExplosionFrame('horizontal', 0.5).x, 96);
  assert.equal(renderer.getExplosionFrame('vertical', 0.2).rotation, Math.PI / 2);
  assert.equal(renderer.getExplosionFrame('tip-left', 0.2).flipX, true);
});

test('three chained bombs detonate in the same update without duplicate explosions', () => {
  const bombs = new BombSystem();
  const player = new PlayerController({ cellSize: 50 });
  player.maxBombs = 3;
  for (const col of [5, 6, 7]) {
    player.spawnAt({ row: 5, col });
    assert.equal(bombs.placeBomb(player), true);
  }
  player.spawnAt({ row: 15, col: 15 });
  bombs.bombs[0].fuse = 0.01;
  bombs.update(0.02, openLevel, player, []);
  assert.equal(bombs.bombs.length, 0);
  assert.equal(bombs.explosions.length, 3);
  assert.equal(player.activeBombs, 0);
  bombs.update(0.01, openLevel, player, []);
  assert.equal(bombs.explosions.length, 3);
});

test('flames stop at walls, destroy one blocking crate, and respect board bounds', () => {
  const bombs = new BombSystem();
  const destroyed = [];
  const level = {
    getTile(row, col) {
      if (row < 0 || col < 0 || row > 4 || col > 4) return null;
      return { type: row === 1 && col === 2 ? TILE_TYPES.BREAKABLE : row === 2 && col === 1 ? TILE_TYPES.WALL : TILE_TYPES.EMPTY };
    },
    destroyBreakable(row, col) { destroyed.push([row, col]); return { destroyed: true }; },
  };
  const tiles = bombs.buildExplosionTiles({ row: 1, col: 1, range: 5 }, level, []);
  assert.equal(tiles.some((tile) => tile.row === 1 && tile.col === 3), false);
  assert.equal(tiles.some((tile) => tile.row === 2 && tile.col === 1), false);
  assert.equal(tiles.every((tile) => tile.row >= 0 && tile.col >= 0), true);
  assert.deepEqual(destroyed, [[1, 2]]);
});

test('level transitions keep upgrades and score while resetting bombs, feedback, and input', () => {
  const { game } = setup();
  game.player.addBombCapacity(); game.player.addRange(); game.score = 1500;
  game.placeBomb(); game.addFeedback('reward', { x: 50, y: 50 }, 1, '+500');
  game.input.handleKeyDown({ code: 'ArrowDown', repeat: false, preventDefault() {} });
  game.nextLevel();
  assert.equal(game.levelNumber, 2);
  assert.equal(game.score, 1500);
  assert.equal(game.player.maxBombs, 2);
  assert.equal(game.player.bombRange, 2);
  assert.equal(game.player.activeBombs, 0);
  assert.equal(game.bombSystem.bombs.length, 0);
  assert.equal(game.feedback.length, 0);
  assert.equal(game.input.getMovementDirections().length, 0);
  assert.equal(game.player.gridPosition.row, 1);
  assert.equal(game.player.gridPosition.col, 1);
  game.restartRun();
  assert.equal(game.levelNumber, 1);
  assert.equal(game.score, 0);
  assert.equal(game.player.maxBombs, 1);
  assert.equal(game.player.bombRange, 1);
});

test('the hidden exit opens only after the last enemy is gone', () => {
  const { game, overlays } = setup();
  const { row, col } = game.level.doorPosition;
  game.level.destroyBreakable(row, col);
  game.tryOpenDoor();
  assert.equal(game.level.doorOpen, false);
  game.enemies = [];
  game.tryOpenDoor();
  assert.equal(game.level.getTile(row, col).type, TILE_TYPES.DOOR_OPEN);
  game.player.spawnAt({ row, col }); game.checkWinCondition();
  assert.equal(game.state, 'won');
  assert.equal(game.score, 1000);
  assert.equal(overlays.length, 1);
});

test('generated levels keep both starting escape routes and valid separated enemy spawns', () => {
  let seed = 12345;
  context.Math = Object.create(Math);
  context.Math.random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  try {
    for (let run = 0; run < 100; run += 1) {
      const level = new LevelState({ columns: 15, rows: 13, levelNumber: 1 + run % 12 });
      for (const [row, col] of [[1, 1], [1, 2], [1, 3], [2, 1], [2, 3], [3, 1], [3, 2], [3, 3]]) {
        assert.equal(level.isWalkable(row, col), true);
      }
      assert.equal(level.getTilesByType(TILE_TYPES.BREAKABLE).length, level.breakableCount);
      const spawns = level.getEnemySpawnTiles(6);
      assert.equal(spawns.length, 6);
      for (const spawn of spawns) {
        assert.ok(spawn.row + spawn.col > 8);
        assert.equal(level.isWalkable(spawn.row, spawn.col), true);
        assert.ok([[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dr, dc]) => level.isWalkable(spawn.row + dr, spawn.col + dc)));
      }
      for (let i = 0; i < spawns.length; i += 1) {
        for (let j = i + 1; j < spawns.length; j += 1) {
          assert.ok(Math.abs(spawns[i].row - spawns[j].row) + Math.abs(spawns[i].col - spawns[j].col) >= 3);
        }
      }
    }
  } finally { delete context.Math; }
});

test('crate generation terminates even with constant randomness', () => {
  context.Math = Object.create(Math); context.Math.random = () => 0;
  try {
    const level = new LevelState({ columns: 15, rows: 13, levelNumber: 3 });
    assert.equal(level.getTilesByType(TILE_TYPES.BREAKABLE).length, 22);
    assert.equal(level.getEnemySpawnTiles(0).length, 0);
  } finally { delete context.Math; }
});

test('a pursuer approaches nearby players only through walkable, unbombed tiles', () => {
  const { EnemyController } = context.window;
  const player = new PlayerController({ cellSize: 50 });
  player.spawnAt({ row: 3, col: 5 });
  const enemy = new EnemyController({ cellSize: 50, spawnTile: { row: 3, col: 3 }, levelNumber: 3, species: 'onil' });
  context.Math = Object.create(Math); context.Math.random = () => 0;
  const bombs = new BombSystem();
  const level = { ...openLevel, isWalkable: () => true };
  try {
    assert.equal(enemy.chooseDirection(level, bombs, player), 'right');
    bombs.bombs.push({ row: 3, col: 4 });
    assert.notEqual(enemy.chooseDirection(level, bombs, player), 'right');
    bombs.reset();
    assert.notEqual(enemy.chooseDirection({ ...openLevel, isWalkable: (row, col) => col !== 4 }, bombs, player), 'right');
    player.spawnAt({ row: 3, col: 12 });
    assert.equal(enemy.chooseDirection(level, bombs, player), 'left');
    player.spawnAt({ row: 3, col: 5 }); player.kill();
    assert.equal(enemy.chooseDirection(level, bombs, player), 'left');
  } finally { delete context.Math; }
});

test('difficulty retains enemy counts and introduces classic species progressively', () => {
  const { game } = setup();
  for (const [level, count, species] of [
    [1, 2, 'ballom'], [2, 2, 'onil'], [3, 3, 'dahl'], [4, 3, 'minvo'],
    [5, 4, 'minvo'], [7, 5, 'kondoria'], [9, 6, 'kondoria'],
    [10, 6, 'ovapi'], [14, 6, 'pass'], [18, 6, 'pontan'], [50, 6, 'pontan'],
  ]) {
    game.levelNumber = level; game.startLevel();
    assert.equal(game.enemies.length, count);
    assert.ok(game.enemies.some((enemy) => enemy.species === species));
    assert.ok(!game.getStatusLabel().includes('Blue marker'));
  }
});

test('sound hooks ignore rejected bombs, coalesce chain explosions, and stop on pause', () => {
  const { game } = setup();
  const played = []; let stopped = 0;
  game.sounds = { unlock() {}, stop() { stopped += 1; }, play(action) { played.push(action); } };
  game.placeBomb(); game.placeBomb();
  assert.deepEqual(played, ['place']);
  game.handleBombEvents([{ type: 'bomb-exploded' }, { type: 'bomb-exploded' }]);
  assert.deepEqual(played, ['place', 'explosion']);
  game.level.grid[1][1].type = TILE_TYPES.POWERUP_BOMB;
  game.handleCollectibles(); game.handleCollectibles();
  assert.deepEqual(played, ['place', 'explosion', 'pickup']);
  game.togglePause(); game.placeBomb();
  assert.equal(stopped, 1);
  assert.equal(played.length, 3);
});
