const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { test } = require('node:test');
const context = vm.createContext({ window: {}, performance });
for (const file of ['assets.js', 'input-manager.js', 'player.js', 'bomb-system.js', 'game.js']) {
  vm.runInContext(fs.readFileSync(file, 'utf8'), context);
}
const { InputManager, PlayerController, BombSystem, GameController } = context.window;
const key = (input, code, down = true, repeat = false) => {
  input[down ? 'handleKeyDown' : 'handleKeyUp']({ code, repeat, preventDefault() {} });
};
function setup(blocked = []) {
  const input = new InputManager();
  const player = new PlayerController({ cellSize: 50 });
  const bombSystem = new BombSystem();
  const level = { isWalkable: (row, col) => row > 0 && col > 0 && row < 7 && col < 9 && !blocked.includes(`${row},${col}`) };
  const game = { player, input, bombSystem, level };
  const step = (dt) => GameController.prototype.updatePlayerMovement.call(game, dt);
  input.onPlaceBomb = () => bombSystem.placeBomb(player);
  return { input, player, bombSystem, step };
}

test('released early turn executes at the next intersection once', () => {
  const { input, player, step } = setup();
  key(input, 'ArrowRight'); step(0.1);
  key(input, 'ArrowDown'); key(input, 'ArrowDown', false);
  step(0.1);
  assert.equal(player.direction, 'down');
  assert.equal(player.gridPosition.row, 2);
  assert.ok(player.renderPosition.y > 50);
  step(0.2);
  assert.equal(player.direction, 'right');
  assert.equal(input.bufferedDirection, null);
});

test('blocked early turn preserves held forward movement until an opening', () => {
  const { input, player, step } = setup(['2,2']);
  key(input, 'ArrowRight'); step(0.1);
  key(input, 'ArrowDown');
  step(0.1);
  assert.equal(player.direction, 'right');
  assert.equal(player.gridPosition.col, 3);
  step(0.2);
  assert.equal(player.direction, 'down');
  assert.equal(player.gridPosition.row, 2);
});

test('continuous movement covers 280 pixels per second at different frame rates', () => {
  for (const fps of [20, 30, 60, 144]) {
    const { input, player, step } = setup();
    key(input, 'ArrowRight');
    for (let frame = 0; frame < fps; frame += 1) step(1 / fps);
    assert.ok(Math.abs(player.renderPosition.x - 330) < 0.000001);
  }
});

test('released forward input stops at the current tile', () => {
  const { input, player, step } = setup();
  key(input, 'ArrowRight'); step(0.05); key(input, 'ArrowRight', false);
  step(0.2);
  assert.equal(player.state, 'idle');
  assert.equal(player.renderPosition.x, 100);
});

test('expired blocked taps do not turn later', () => {
  const { input, player, step } = setup(['2,2']);
  key(input, 'ArrowRight'); step(0.01);
  key(input, 'ArrowDown'); key(input, 'ArrowDown', false);
  step(0.4);
  assert.equal(player.direction, 'right');
  assert.equal(input.bufferedDirection, null);
});

test('walls, boundaries, and bombs block movement', () => {
  const { input, player, bombSystem, step } = setup(['1,2']);
  key(input, 'ArrowRight'); step(0.1);
  assert.equal(player.renderPosition.x, 50);
  input.clear(); key(input, 'ArrowLeft'); step(0.1);
  assert.equal(player.renderPosition.x, 50);
  input.clear(); bombSystem.bombs.push({ row: 2, col: 1 });
  key(input, 'ArrowDown'); step(0.1);
  assert.equal(player.renderPosition.y, 50);
});

test('bomb placement before, at, and after halfway never interrupts travel', () => {
  for (const progress of [0.25, 0.5, 0.75]) {
    const { input, player, bombSystem, step } = setup();
    key(input, 'ArrowRight'); step(progress * 50 / 280);
    const before = player.renderPosition.x;
    key(input, 'Space'); key(input, 'Space', true, true);
    assert.equal(bombSystem.bombs.length, 1);
    assert.equal(bombSystem.bombs[0].col, progress < 0.5 ? 1 : 2);
    assert.equal(player.state, 'walking');
    assert.equal(player.direction, 'right');
    step(0.05);
    assert.ok(Math.abs(player.renderPosition.x - before - 14) < 0.000001);
  }
});

test('bomb placement and a buffered turn work together', () => {
  const { input, player, bombSystem, step } = setup();
  key(input, 'ArrowRight'); step(0.12);
  key(input, 'ArrowDown'); key(input, 'ArrowDown', false); key(input, 'Space');
  step(0.1);
  assert.equal(bombSystem.bombs[0].col, 2);
  assert.equal(player.direction, 'down');
  assert.ok(player.renderPosition.y > 50);
});

test('clear removes held keys and buffered turns; repeats do not replace intent', () => {
  const { input } = setup();
  key(input, 'ArrowRight'); key(input, 'ArrowDown'); key(input, 'ArrowRight', true, true);
  assert.equal(input.getMovementDirections()[0], 'down');
  input.clear();
  assert.equal(input.getMovementDirections().length, 0);
});


test('pause and both resume paths clear inputs entered while paused', () => {
  const { input, player } = setup();
  let overlay;
  const game = {
    input, player, state: 'playing',
    hud: { showOverlay: (config) => { overlay = config; }, hideOverlay() {} },
  };
  key(input, 'ArrowRight');
  GameController.prototype.togglePause.call(game);
  assert.equal(input.getMovementDirections().length, 0);
  key(input, 'ArrowDown');
  overlay.onPrimary();
  assert.equal(input.getMovementDirections().length, 0);
  GameController.prototype.togglePause.call(game);
  key(input, 'ArrowLeft');
  GameController.prototype.togglePause.call(game);
  assert.equal(input.getMovementDirections().length, 0);
});

test('death clears buffered movement and prevents further travel', () => {
  const { input, player, step } = setup();
  key(input, 'ArrowRight'); step(0.1); key(input, 'ArrowDown');
  const game = { input, player, state: 'playing', hud: { showOverlay() {} } };
  GameController.prototype.handlePlayerDeath.call(game);
  assert.equal(input.getMovementDirections().length, 0);
  const before = player.renderPosition.x;
  step(0.1);
  assert.equal(player.renderPosition.x, before);
  assert.equal(player.state, 'dying');
});
