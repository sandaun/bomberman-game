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
    door: 'images/door.png',
  },
  items: {
    sheet: 'images/SuperBomberman2Items.png',
  },
  characters: {
    player: 'images/BombermanPlayers.png',
    enemy: 'images/enemy2.png',
    enemyDeath: 'images/BombermanEnemies.png',
    enemyNES: 'images/BombermanNESEnemies.png',
  },
  effects: {
    bombSheet: 'images/BombermanBombsExplosions.png',
  },
  ui: {
    title: 'images/bombermanTitle.png',
  },
};

const SPRITE_DEFINITIONS = {
  powerup: {
    frameWidth: 16,
    frameHeight: 16,
    drawScale: 0.64,
    frames: {
      [TILE_TYPES.POWERUP_BOMB]: { x: 0, y: 0 },
      [TILE_TYPES.POWERUP_RANGE]: { x: 16, y: 0 },
    },
  },
  player: {
    frameWidth: 18,
    frameHeight: 22,
    drawScale: 0.96,
    deathDuration: 0.55,
    deathFrameWidth: 24,
    deathFrameHeight: 24,
    // Second row: hit poses followed by the original dissolving sequence.
    deathFrames: [
      { x: 9, y: 29 },
      { x: 42, y: 29 },
      { x: 74, y: 29 },
      { x: 107, y: 29 },
      { x: 140, y: 29 },
      { x: 173, y: 29 },
      { x: 206, y: 29 },
      { x: 239, y: 29 },
      { x: 272, y: 29 },
    ],
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
    deathDuration: 0.45,
    deathFrameWidth: 16,
    deathFrameHeight: 18,
    // Balloon hit poses, then the sheet's shared disappearance sequence A.
    deathFrames: [
      { x: 55, y: 4 },
      { x: 72, y: 4 },
      { x: 13, y: 411 },
      { x: 30, y: 411 },
      { x: 47, y: 411 },
      { x: 64, y: 411 },
      { x: 81, y: 411 },
    ],
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

// NES sheet: six walking poses, then a hit pose and a shared shrinking sequence.
function createNESEnemySprite(row, burstRow) {
  return {
    spriteKey: 'characters.enemyNES',
    frameWidth: 16,
    frameHeight: 16,
    drawScale: 0.74,
    frames: [0, 16, 32, 48, 64, 80].map((x) => ({ x, y: row })),
    deathDuration: 0.45,
    deathFrameWidth: 16,
    deathFrameHeight: 16,
    deathFrames: [{ x: 96, y: row }, ...[112, 128, 144, 160].map((x) => ({ x, y: burstRow }))],
  };
}

const ENEMY_SPRITES = {
  ballom: { ...SPRITE_DEFINITIONS.enemy, spriteKey: 'characters.enemy', deathSpriteKey: 'characters.enemyDeath' },
  onil: createNESEnemySprite(255, 287),
  dahl: createNESEnemySprite(271, 271),
  minvo: createNESEnemySprite(287, 239),
  kondoria: createNESEnemySprite(303, 287),
  ovapi: createNESEnemySprite(319, 271),
  pass: createNESEnemySprite(335, 239),
  pontan: {
    ...createNESEnemySprite(351, 271),
    frames: [0, 16, 32, 48, 64].map((x) => ({ x, y: 351 })),
    deathFrames: [{ x: 96, y: 319 }, ...[112, 128, 144, 160].map((x) => ({ x, y: 271 }))],
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
window.ENEMY_SPRITES = ENEMY_SPRITES;
window.AssetStore = AssetStore;
