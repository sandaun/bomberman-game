const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { test } = require('node:test');
const context = vm.createContext({ window: {} });
for (const file of ['assets.js', 'player.js', 'enemy.js', 'renderer.js']) {
  vm.runInContext(fs.readFileSync(file, 'utf8'), context);
}
const { Renderer, PlayerController, EnemyController, SPRITE_DEFINITIONS } = context.window;
function setup() {
  const draws = [];
  const sprite = { complete: true };
  const deathSprite = { complete: true };
  const renderer = new Renderer({
    cellSize: 50, columns: 15, rows: 13,
    ctx: { drawImage(...args) { draws.push(args); }, save() {}, restore() {} },
    assetStore: { get: (key) => key === 'characters.enemyDeath' ? deathSprite : sprite },
  });
  return { renderer, draws, sprite, deathSprite };
}

test('player plays all nine death frames once, independent of facing and render timestamp', () => {
  const { renderer, draws, sprite } = setup();
  const player = new PlayerController({ cellSize: 50 });
  player.direction = 'right'; player.kill();
  const definition = SPRITE_DEFINITIONS.player;
  assert.equal(player.deathTimer, definition.deathDuration);
  for (let i = 0; i < 9; i += 1) {
    player.deathTimer = definition.deathDuration * (1 - (i + 0.5) / 9);
    renderer.drawPlayer(player, 999999 - i * 100);
    const draw = draws.at(-1);
    assert.equal(draw[0], sprite);
    assert.equal(draw[1], definition.deathFrames[i].x);
    assert.equal(draw[2], 29);
    assert.equal(draw[3], 24);
    assert.equal(draw[4], 24);
  }
  player.update(1); renderer.drawPlayer(player, 0);
  assert.equal(draws.length, 9);
});

test('balloon uses its death sheet for the two hit poses and all five burst frames', () => {
  const { renderer, draws, sprite, deathSprite } = setup();
  const enemy = new EnemyController({ cellSize: 50, spawnTile: { row: 1, col: 1 }, levelNumber: 1 });
  renderer.drawEnemies([enemy], 0);
  assert.equal(draws[0][0], sprite);
  assert.equal(draws[0][3], 48);
  enemy.kill();
  const definition = SPRITE_DEFINITIONS.enemy;
  assert.equal(enemy.deathTimer, definition.deathDuration);
  for (let i = 0; i < 7; i += 1) {
    enemy.deathTimer = definition.deathDuration * (1 - (i + 0.5) / 7);
    renderer.drawEnemies([enemy], 999999 - i * 100);
    const draw = draws.at(-1);
    assert.equal(draw[0], deathSprite);
    assert.equal(draw[1], definition.deathFrames[i].x);
    assert.equal(draw[2], definition.deathFrames[i].y);
    assert.equal(draw[3], 16);
    assert.equal(draw[4], 18);
    assert.equal(draw[7] / draw[8], 16 / 18);
  }
  enemy.update(1); renderer.drawEnemies([enemy], 0);
  assert.equal(draws.length, 8);
});

test('death frame rectangles stay inside the original sheets and never loop at the end', () => {
  const { renderer, draws, sprite } = setup();
  for (const [definition, width, height] of [
    [SPRITE_DEFINITIONS.player, 304, 687], [SPRITE_DEFINITIONS.enemy, 329, 526],
  ]) {
    for (const frame of definition.deathFrames) {
      assert.ok(frame.x >= 0 && frame.y >= 0);
      assert.ok(frame.x + definition.deathFrameWidth <= width);
      assert.ok(frame.y + definition.deathFrameHeight <= height);
    }
    renderer.drawDeathSprite({ type: 'player', deathTimer: 0, renderPosition: { x: 50, y: 50 } }, sprite, definition);
    assert.equal(draws.at(-1)[1], definition.deathFrames.at(-1).x);
  }
});
