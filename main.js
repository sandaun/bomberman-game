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
  const game = new GameController({
    canvas,
    ctx,
    columns: canvas.width / 50,
    rows: canvas.height / 50,
    cellSize: 50,
    assetStore,
    hud,
    input,
  });

  document.getElementById('startButton').addEventListener('click', () => {
    game.startNewGame();
  });

  document.getElementById('pauseButton').addEventListener('click', () => {
    game.togglePause();
  });

  game.boot();
});
