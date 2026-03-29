const TILE_TYPES = {
  EMPTY: 'empty',
  WALL: 'wall',
  BREAKABLE: 'breakable',
  DOOR_CLOSED: 'door-closed',
  DOOR_OPEN: 'door-open',
  POWERUP_BOMB: 'powerup-bomb',
  POWERUP_RANGE: 'powerup-range',
};

const HIDDEN_CONTENT = {
  NONE: 'none',
  DOOR: 'door',
  POWERUP_BOMB: 'powerup-bomb',
  POWERUP_RANGE: 'powerup-range',
};

const ENTITY_STATES = {
  IDLE: 'idle',
  WALKING: 'walking',
  DYING: 'dying',
  DEAD: 'dead',
};

const GAME_STATES = {
  START: 'start',
  PLAYING: 'playing',
  PAUSED: 'paused',
  WON: 'won',
  LOST: 'lost',
};

const DIRECTION_VECTORS = {
  up: { row: -1, col: 0 },
  down: { row: 1, col: 0 },
  left: { row: 0, col: -1 },
  right: { row: 0, col: 1 },
};

const OPPOSITE_DIRECTIONS = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

const ASSET_MANIFEST = {
  board: {
    background: 'images/grass.png',
    wall: 'images/brick.png',
    breakable: 'images/wood.png',
    door: 'images/door.png',
  },
  characters: {
    player: 'images/BombermanPlayers.png',
    enemy: 'images/enemy2.png',
  },
  effects: {
    bombSheet: 'images/BombermanBombsExplosions.png',
  },
  ui: {
    title: 'images/bombermanTitle.png',
  },
};

const SPRITE_DEFINITIONS = {
  player: {
    frameWidth: 18,
    frameHeight: 22,
    drawScale: 0.96,
    animations: {
      down: {
        idle: [{ x: 4, y: 5, flipX: false }],
        walk: [
          { x: 30, y: 5, flipX: false },
          { x: 56, y: 5, flipX: false },
        ],
      },
      left: {
        idle: [{ x: 83, y: 5, flipX: false }],
        walk: [
          { x: 107, y: 5, flipX: false },
          { x: 132, y: 5, flipX: false },
        ],
      },
      right: {
        idle: [{ x: 83, y: 5, flipX: true }],
        walk: [
          { x: 107, y: 5, flipX: true },
          { x: 132, y: 5, flipX: true },
        ],
      },
      up: {
        idle: [{ x: 157, y: 5, flipX: false }],
        walk: [
          { x: 183, y: 5, flipX: false },
          { x: 208, y: 5, flipX: false },
        ],
      },
    },
  },
  enemy: {
    frameWidth: 48,
    frameHeight: 48,
    drawScale: 0.74,
    frames: [
      { x: 0, y: 0 },
      { x: 50, y: 0 },
      { x: 100, y: 0 },
    ],
  },
  bomb: {
    frameWidth: 16,
    frameHeight: 16,
    fuseFrames: [
      { x: 0, y: 0 },
      { x: 16, y: 0 },
      { x: 32, y: 0 },
      { x: 16, y: 0 },
    ],
    blastFrames: [
      { x: 48, y: 0 },
      { x: 64, y: 0 },
      { x: 80, y: 0 },
      { x: 96, y: 0 },
    ],
  },
};

class AssetStore {
  constructor(manifest) {
    this.manifest = manifest;
    this.images = {};
  }

  loadAll() {
    const entries = this.flattenManifest(this.manifest);
    return Promise.all(entries.map(([key, src]) => this.loadImage(key, src)));
  }

  loadImage(key, src) {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        this.images[key] = image;
        resolve(image);
      };
      image.onerror = () => {
        this.images[key] = image;
        resolve(image);
      };
      image.src = src;
    });
  }

  flattenManifest(manifest, prefix = '') {
    return Object.entries(manifest).flatMap(([key, value]) => {
      const nextKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'string') {
        return [[nextKey, value]];
      }
      return this.flattenManifest(value, nextKey);
    });
  }

  get(key) {
    return this.images[key];
  }
}

window.TILE_TYPES = TILE_TYPES;
window.HIDDEN_CONTENT = HIDDEN_CONTENT;
window.ENTITY_STATES = ENTITY_STATES;
window.GAME_STATES = GAME_STATES;
window.DIRECTION_VECTORS = DIRECTION_VECTORS;
window.OPPOSITE_DIRECTIONS = OPPOSITE_DIRECTIONS;
window.ASSET_MANIFEST = ASSET_MANIFEST;
window.SPRITE_DEFINITIONS = SPRITE_DEFINITIONS;
window.AssetStore = AssetStore;
