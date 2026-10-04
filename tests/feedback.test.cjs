const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { test } = require('node:test');
const context = vm.createContext({
  window: { requestAnimationFrame: () => 1 }, performance,
});
for (const file of ['assets.js', 'level-state.js', 'input-manager.js', 'player.js', 'enemy.js', 'bomb-system.js', 'renderer.js', 'game.js']) {
  vm.runInContext(fs.readFileSync(file, 'utf8'), context);
}
const { GameController, EnemyController, Renderer, TILE_TYPES, HIDDEN_CONTENT } = context.window;
function setup() {
  const overlays = [];
  const game = new GameController({
    canvas: {}, ctx: {}, columns: 15, rows: 13, cellSize: 50,
    assetStore: { get() {} }, input: new context.window.InputManager(),
    hud: { hideOverlay() {}, showOverlay(config) { overlays.push(config); } },
  });
  game.startLevel();
  game.enemies = [];
  game.level.grid.forEach((row) => row.forEach((tile) => {
    if (tile.type !== TILE_TYPES.WALL) {
      tile.type = TILE_TYPES.EMPTY;
      tile.hiddenContent = HIDDEN_CONTENT.NONE;
    }
  }));
  return { game, overlays };
}

test('death finishes before the game-over overlay, freezes gameplay, and displays once', () => {
  const { game, overlays } = setup();
  game.player.tryMove('right', game.level, game.bombSystem);
  game.player.update(0.05);
  const x = game.player.renderPosition.x;
  game.placeBomb();
  const fuse = game.bombSystem.bombs[0].fuse;
  game.handlePlayerDeath();
  assert.equal(game.state, 'lost');
  assert.equal(overlays.length, 0);
  game.placeBomb();
  assert.equal(game.bombSystem.bombs.length, 1);
  game.renderFrame = () => {};
  game.lastFrameTime = 0;
  for (let frame = 1; frame <= 10; frame += 1) game.loop(frame * 50);
  assert.equal(game.player.renderPosition.x, x);
  assert.equal(game.bombSystem.bombs[0].fuse, fuse);
  assert.equal(overlays.length, 0);
  game.loop(550); game.loop(600);
  assert.equal(game.player.state, 'dead');
  assert.equal(overlays.length, 1);
  game.loop(650); game.handlePlayerDeath();
  assert.equal(overlays.length, 1);
});

test('destruction events locate chips and score each destroyed block once', () => {
  const { game } = setup();
  game.level.grid[1][2].type = TILE_TYPES.BREAKABLE;
  game.bombSystem.placeBomb(game.player);
  const events = game.bombSystem.update(2.3, game.level, game.player, []);
  const destroyed = events.filter((event) => event.type === 'breakable-destroyed');
  assert.equal(destroyed.length, 1);
  assert.equal(destroyed[0].row, 1);
  assert.equal(destroyed[0].col, 2);
  game.handleBombEvents(destroyed);
  assert.equal(game.score, 100);
  assert.equal(game.feedback[0].x, 100);
  assert.equal(game.feedback[0].y, 50);
  assert.equal(game.level.grid[1][2].type, TILE_TYPES.EMPTY);
  assert.equal(game.bombSystem.update(0.01, game.level, game.player, []).filter((event) => event.type === 'breakable-destroyed').length, 0);
});

test('enemy reward uses its visible position and cannot repeat on lingering flames', () => {
  const { game } = setup();
  const enemy = new EnemyController({ spawnTile: { row: 1, col: 2 }, cellSize: 50, levelNumber: 1 });
  enemy.renderPosition.x = 85;
  game.enemies = [enemy];
  game.bombSystem.explosions = [{ tiles: [{ row: 1, col: 2 }], timer: 0.45, duration: 0.45 }];
  game.handleBombEvents(game.bombSystem.update(0.01, game.level, game.player, game.enemies));
  assert.equal(game.score, 100);
  assert.equal(enemy.state, 'dying');
  assert.equal(game.feedback[0].x, 85);
  enemy.renderPosition.x = 90;
  assert.equal(game.feedback[0].x, 85);
  game.handleBombEvents(game.bombSystem.update(0.01, game.level, game.player, game.enemies));
  assert.equal(game.score, 100);
  enemy.update(0.45, game.level, game.bombSystem);
  game.cleanupEnemies();
  assert.equal(game.enemies.length, 0);
});

test('each pickup shows the matching upgrade once and keeps existing scoring', () => {
  for (const [type, label, property] of [
    [TILE_TYPES.POWERUP_BOMB, '+1 BOMB', 'maxBombs'],
    [TILE_TYPES.POWERUP_RANGE, '+1 RANGE', 'bombRange'],
  ]) {
    const { game } = setup();
    game.level.grid[1][1].type = type;
    game.handleCollectibles(); game.handleCollectibles();
    assert.equal(game.score, 250);
    assert.equal(game.player[property], 2);
    assert.equal(game.feedback.length, 1);
    assert.equal(game.feedback[0].label, label);
  }
});

test('feedback expires in game time, freezes while paused, and clears on restart', () => {
  const { game } = setup();
  game.addFeedback('reward', { x: 50, y: 50 }, 0.7, '+1 BOMB');
  game.renderFrame = () => {};
  game.lastFrameTime = 0;
  game.state = 'paused';
  game.loop(50);
  assert.equal(game.feedback[0].timer, 0.7);
  game.state = 'playing'; game.loop(100);
  assert.ok(game.feedback[0].timer < 0.7);
  game.updateFeedback(1);
  assert.equal(game.feedback.length, 0);
  game.addFeedback('breakable', { x: 50, y: 50 }, 0.4);
  game.restartRun();
  assert.equal(game.feedback.length, 0);
  assert.equal(game.player.state, 'idle');
});

test('lethal damage cannot collect an upgrade or trigger a level win in the same update', () => {
  const { game } = setup();
  game.level.grid[1][1].type = TILE_TYPES.POWERUP_BOMB;
  game.bombSystem.explosions = [{ tiles: [{ row: 1, col: 1 }], timer: 0.45, duration: 0.45 }];
  game.update(0.01);
  assert.equal(game.player.maxBombs, 1);
  assert.equal(game.state, 'lost');
  const next = setup().game;
  next.level.grid[1][1].type = TILE_TYPES.DOOR_OPEN;
  next.level.grid[1][2].type = TILE_TYPES.WALL;
  next.level.grid[2][1].type = TILE_TYPES.WALL;
  next.enemies = [new EnemyController({ spawnTile: { row: 1, col: 1 }, cellSize: 50, levelNumber: 1 })];
  next.update(0.001);
  assert.equal(next.state, 'lost');
});

test('finished death is hidden and death sprites have no extra transforms', () => {
  const draws = [];
  const transforms = [];
  const ctx = {
    save() {}, restore() {}, strokeRect() {},
    translate(...values) { transforms.push(values); }, scale(...values) { transforms.push(values); },
    drawImage(...values) { draws.push(values); },
  };
  const renderer = new Renderer({ ctx, assetStore: { get: () => ({ complete: true }) }, cellSize: 50, columns: 15, rows: 13 });
  const { game } = setup();
  game.player.kill(); game.player.update(0.25);
  renderer.reducedMotion = true;
  renderer.drawPlayer(game.player, 0);
  assert.equal(draws.length, 1);
  assert.equal(transforms.length, 0);
  assert.equal(draws[0][2], 29);
  assert.equal(draws[0][3], 24);
  assert.equal(draws[0][4], 24);
  game.player.update(0.55);
  renderer.drawPlayer(game.player, 0);
  assert.equal(draws.length, 1);
});

test('three continues retain progress and upgrades before final game over', () => {
  const { game, overlays } = setup();
  game.levelNumber = 3;
  game.score = 1750;
  game.player.addBombCapacity();
  game.player.addRange();
  game.continueRun();
  assert.equal(game.continuesRemaining, 3);
  for (let remaining = 3; remaining > 0; remaining -= 1) {
    game.placeBomb();
    game.handlePlayerDeath();
    game.handlePlayerDeath();
    game.continueRun();
    assert.equal(game.continuesRemaining, remaining);
    game.updateDeathFeedback(0.6);
    const overlay = overlays.at(-1);
    assert.equal(overlay.primaryLabel, 'Continue');
    overlay.onPrimary();
    overlay.onPrimary();
    assert.equal(game.continuesRemaining, remaining - 1);
    assert.equal(game.state, 'playing');
    assert.equal(game.levelNumber, 3);
    assert.equal(game.score, 1750);
    assert.equal(game.player.maxBombs, 2);
    assert.equal(game.player.bombRange, 2);
    assert.equal(game.player.activeBombs, 0);
    assert.equal(game.bombSystem.bombs.length, 0);
    assert.equal(game.bombSystem.explosions.length, 0);
    assert.equal(game.player.gridPosition.row, 1);
    assert.equal(game.player.gridPosition.col, 1);
  }
  game.handlePlayerDeath();
  game.updateDeathFeedback(0.6);
  assert.equal(overlays.at(-1).title, 'Game over');
  game.continueRun();
  assert.equal(game.state, 'lost');
  overlays.at(-1).onPrimary();
  assert.equal(game.continuesRemaining, 3);
  assert.equal(game.levelNumber, 1);
  assert.equal(game.score, 0);
  assert.equal(game.player.maxBombs, 1);
  assert.equal(game.player.bombRange, 1);
});

test('level progression keeps credits and a new game restores them', () => {
  const { game } = setup();
  game.continuesRemaining = 1;
  game.nextLevel();
  assert.equal(game.continuesRemaining, 1);
  game.hud.showGameScreen = () => {};
  game.startNewGame();
  assert.equal(game.continuesRemaining, 3);
});
