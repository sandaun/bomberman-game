const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { test } = require('node:test');
const source = fs.readFileSync('sound-system.js', 'utf8');
function create(window) {
  vm.runInContext(source, vm.createContext({ window }));
  return new window.SoundSystem();
}

test('missing browser audio support leaves game actions usable', () => {
  const sounds = create({});
  assert.equal(sounds.enabled, false);
  sounds.unlock(); sounds.play('place'); sounds.stop();
  assert.equal(sounds.context, null);
  assert.equal(sounds.voices.size, 0);
});

test('audio initialization failure disables sound without throwing', () => {
  const sounds = create({ AudioContext: class { constructor() { throw new Error('Audio unavailable'); } } });
  sounds.unlock(); sounds.play('explosion');
  assert.equal(sounds.enabled, false);
  assert.equal(sounds.context, null);
});

test('muting cancels active and scheduled sounds and blocks subsequent playback', () => {
  let cancelled = 0;
  const sounds = create({ AudioContext: class {} });
  sounds.voices.add({ stop() { cancelled += 1; } });
  sounds.voices.add({ stop() { cancelled += 1; } });
  sounds.setEnabled(false); sounds.play('pickup');
  assert.equal(cancelled, 2);
  assert.equal(sounds.voices.size, 0);
  assert.equal(sounds.enabled, false);
});
