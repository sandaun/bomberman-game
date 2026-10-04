class InputManager {
  constructor() {
    this.directionByCode = {
      ArrowUp: 'up',
      ArrowDown: 'down',
      ArrowLeft: 'left',
      ArrowRight: 'right',
      KeyW: 'up',
      KeyS: 'down',
      KeyA: 'left',
      KeyD: 'right',
    };
    this.activeDirections = [];
    this.bufferedDirection = null;
    this.bufferTimeRemaining = 0;
    this.onPlaceBomb = null;
    this.onPause = null;
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
  }

  attach() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  detach() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }

  handleKeyDown(event) {
    const direction = this.directionByCode[event.code];

    if (direction) {
      event.preventDefault();
      if (event.repeat) {
        return;
      }
      this.bufferedDirection = direction;
      this.bufferTimeRemaining = 0.22;
      this.activeDirections = this.activeDirections.filter(
        (value) => value !== direction
      );
      this.activeDirections.push(direction);
      return;
    }

    if (event.code === 'Space') {
      event.preventDefault();
      if (!event.repeat && this.onPlaceBomb) {
        this.onPlaceBomb();
      }
      return;
    }

    if (event.code === 'KeyP' && !event.repeat && this.onPause) {
      this.onPause();
    }
  }

  handleKeyUp(event) {
    const direction = this.directionByCode[event.code];
    if (!direction) {
      return;
    }

    this.activeDirections = this.activeDirections.filter(
      (value) => value !== direction
    );
  }

  update(deltaTime) {
    this.bufferTimeRemaining = Math.max(0, this.bufferTimeRemaining - deltaTime);
    if (this.bufferTimeRemaining === 0) {
      this.bufferedDirection = null;
    }
  }

  getMovementDirections() {
    return [...new Set([
      this.bufferedDirection,
      ...this.activeDirections.slice().reverse(),
    ])].filter(Boolean);
  }

  consumeDirection(direction) {
    if (this.bufferedDirection === direction) {
      this.bufferedDirection = null;
      this.bufferTimeRemaining = 0;
    }
  }

  clear() {
    this.activeDirections = [];
    this.bufferedDirection = null;
    this.bufferTimeRemaining = 0;
  }
}

window.InputManager = InputManager;
