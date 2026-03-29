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

  getDirectionIntent() {
    return this.activeDirections[this.activeDirections.length - 1] || null;
  }

  clear() {
    this.activeDirections = [];
  }
}

window.InputManager = InputManager;
