class HudController {
  constructor(config) {
    this.startScreen = config.startScreen;
    this.gameScreen = config.gameScreen;
    this.scoreValue = config.scoreValue;
    this.levelValue = config.levelValue;
    this.bombsValue = config.bombsValue;
    this.rangeValue = config.rangeValue;
    this.enemiesValue = config.enemiesValue;
    this.statusValue = config.statusValue;
    this.pauseButton = config.pauseButton;
    this.overlay = config.overlay;
    this.overlayTitle = config.overlayTitle;
    this.overlayMessage = config.overlayMessage;
    this.overlayPrimary = config.overlayPrimary;
    this.overlaySecondary = config.overlaySecondary;
  }

  showStartScreen() {
    this.startScreen.hidden = false;
    this.gameScreen.hidden = true;
    this.hideOverlay();
  }

  showGameScreen() {
    this.startScreen.hidden = true;
    this.gameScreen.hidden = false;
  }

  update(stats) {
    this.scoreValue.textContent = String(stats.score);
    this.levelValue.textContent = String(stats.level);
    this.bombsValue.textContent = `${stats.bombsPlaced}/${stats.maxBombs}`;
    this.rangeValue.textContent = String(stats.range);
    this.enemiesValue.textContent = String(stats.enemies);
    this.statusValue.textContent = stats.status;
    this.pauseButton.textContent =
      stats.state === GAME_STATES.PAUSED ? 'Resume' : 'Pause';
  }

  showOverlay(config) {
    this.overlay.hidden = false;
    this.overlayTitle.textContent = config.title;
    this.overlayMessage.textContent = config.message;
    this.overlayPrimary.textContent = config.primaryLabel;
    this.overlayPrimary.onclick = config.onPrimary;

    if (config.secondaryLabel) {
      this.overlaySecondary.hidden = false;
      this.overlaySecondary.textContent = config.secondaryLabel;
      this.overlaySecondary.onclick = config.onSecondary;
    } else {
      this.overlaySecondary.hidden = true;
      this.overlaySecondary.onclick = null;
    }
  }

  hideOverlay() {
    this.overlay.hidden = true;
    this.overlayPrimary.onclick = null;
    this.overlaySecondary.onclick = null;
  }
}

window.HudController = HudController;
