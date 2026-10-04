window.addEventListener('DOMContentLoaded', async () => {
  const canvas = document.getElementById('bomberman');
  const ctx = canvas.getContext('2d');
  const assetStore = new AssetStore(ASSET_MANIFEST);

  await assetStore.loadAll();

  const hud = new HudController({
    startScreen: document.getElementById('startScreen'),
    gameScreen: document.getElementById('gameScreen'),
    scoreValue: document.getElementById('hudScore'),
    levelValue: document.getElementById('hudLevel'),
    continuesValue: document.getElementById('hudContinues'),
    bombsValue: document.getElementById('hudBombs'),
    rangeValue: document.getElementById('hudRange'),
    enemiesValue: document.getElementById('hudEnemies'),
    statusValue: document.getElementById('hudStatus'),
    pauseButton: document.getElementById('pauseButton'),
    overlay: document.getElementById('overlay'),
    overlayTitle: document.getElementById('overlayTitle'),
    overlayMessage: document.getElementById('overlayMessage'),
    overlayPrimary: document.getElementById('overlayPrimary'),
    overlaySecondary: document.getElementById('overlaySecondary'),
  });

  const input = new InputManager();
  const sounds = new SoundSystem();
  const game = new GameController({
    canvas,
    ctx,
    columns: canvas.width / 50,
    rows: canvas.height / 50,
    cellSize: 50,
    assetStore,
    hud,
    input,
    sounds,
  });

  document.getElementById('startButton').addEventListener('click', () => {
    game.startNewGame();
  });

  document.getElementById('pauseButton').addEventListener('click', () => {
    game.togglePause();
  });

  const soundButton = document.getElementById('soundButton');
  soundButton.disabled = !sounds.enabled;
  soundButton.textContent = sounds.enabled ? 'Sound: on' : 'Sound unavailable';
  soundButton.setAttribute('aria-pressed', String(sounds.enabled));
  soundButton.addEventListener('click', () => {
    sounds.setEnabled(!sounds.enabled);
    soundButton.textContent = sounds.enabled ? 'Sound: on' : 'Sound: off';
    soundButton.setAttribute('aria-pressed', String(sounds.enabled));
  });

  game.boot();
});
