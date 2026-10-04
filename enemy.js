// Speeds are tuned for this 50-pixel board, not original NES timing.
const ENEMY_DEFINITIONS = {
  ballom: { name: 'Ballom', speed: 165, score: 100, wallPass: false, pursuit: 'none', radius: 0, chance: 0, straightChance: 0.8 },
  onil: { name: 'Onil', speed: 190, score: 200, wallPass: false, pursuit: 'nearby', radius: 6, chance: 0.65, straightChance: 0.55 },
  dahl: { name: 'Dahl', speed: 190, score: 400, wallPass: false, pursuit: 'none', radius: 0, chance: 0, straightChance: 0.9 },
  minvo: { name: 'Minvo', speed: 225, score: 800, wallPass: false, pursuit: 'nearby', radius: 6, chance: 0.75, straightChance: 0.55 },
  kondoria: { name: 'Kondoria', speed: 90, score: 1000, wallPass: true, pursuit: 'route', radius: 8, chance: 0.85, straightChance: 0.55 },
  ovapi: { name: 'Ovapi', speed: 145, score: 2000, wallPass: true, pursuit: 'nearby', radius: 6, chance: 0.65, straightChance: 0.55 },
  pass: { name: 'Pass', speed: 240, score: 4000, wallPass: false, pursuit: 'route', radius: Infinity, chance: 1, straightChance: 0.55 },
  pontan: { name: 'Pontan', speed: 260, score: 8000, wallPass: true, pursuit: 'route', radius: Infinity, chance: 1, straightChance: 0.55 },
};

// Keep the existing enemy counts; introduce species at classic milestones.
const ENEMY_LINEUPS = [
  { level: 1, species: ['ballom', 'ballom'] },
  { level: 2, species: ['ballom', 'onil'] },
  { level: 3, species: ['ballom', 'onil', 'dahl'] },
  { level: 4, species: ['onil', 'dahl', 'minvo'] },
  { level: 5, species: ['ballom', 'onil', 'dahl', 'minvo'] },
  { level: 7, species: ['onil', 'dahl', 'minvo', 'kondoria', 'kondoria'] },
  { level: 9, species: ['ballom', 'onil', 'dahl', 'minvo', 'kondoria', 'kondoria'] },
  { level: 10, species: ['onil', 'dahl', 'minvo', 'kondoria', 'ovapi', 'ovapi'] },
  { level: 14, species: ['dahl', 'minvo', 'kondoria', 'ovapi', 'ovapi', 'pass'] },
  // Introduce Pontan earlier than NES stage 48 for this smaller endless game.
  { level: 18, species: ['minvo', 'kondoria', 'ovapi', 'ovapi', 'pass', 'pontan'] },
];

function getEnemyLineup(levelNumber) {
  return ENEMY_LINEUPS.findLast((lineup) => levelNumber >= lineup.level).species;
}

class EnemyController {
  constructor(config) {
    this.cellSize = config.cellSize;
    this.species = config.species || 'ballom';
    this.definition = ENEMY_DEFINITIONS[this.species];
    this.scoreValue = this.definition.score;
    this.type = 'enemy';
    this.direction = 'left';
    this.state = ENTITY_STATES.IDLE;
    this.spawnAt(config.spawnTile);
    this.moveSpeed = this.definition.speed;
    this.deathTimer = 0;
  }

  spawnAt(tile) {
    this.gridPosition = { row: tile.row, col: tile.col };
    this.previousGridPosition = { row: tile.row, col: tile.col };
    this.renderPosition = {
      x: tile.col * this.cellSize,
      y: tile.row * this.cellSize,
    };
    this.travelProgress = 1;
  }

  isActive() {
    return this.state !== ENTITY_STATES.DEAD;
  }

  isMoving() {
    return this.state === ENTITY_STATES.WALKING;
  }

  update(deltaTime, level, bombSystem, player) {
    if (this.state === ENTITY_STATES.DYING) {
      this.deathTimer = Math.max(0, this.deathTimer - deltaTime);
      if (this.deathTimer === 0) {
        this.state = ENTITY_STATES.DEAD;
      }
      return;
    }

    if (this.state === ENTITY_STATES.DEAD) {
      return;
    }
    let remainingTime = deltaTime;
    while (remainingTime > 0) {
      if (!this.isMoving()) {
        const nextDirection = this.chooseDirection(level, bombSystem, player);
        if (!nextDirection) return;
        this.beginMove(nextDirection);
      }
      const travelTime = (1 - this.travelProgress) * this.cellSize / this.moveSpeed;
      const step = Math.min(remainingTime, travelTime);
      this.updateMovement(step);
      remainingTime -= step;
      if (step === travelTime) {
        this.travelProgress = 1;
        this.state = ENTITY_STATES.IDLE;
      }
    }
  }

  updateMovement(deltaTime) {
    const progressStep = (this.moveSpeed * deltaTime) / this.cellSize;
    this.travelProgress = Math.min(1, this.travelProgress + progressStep);

    const start = {
      x: this.previousGridPosition.col * this.cellSize,
      y: this.previousGridPosition.row * this.cellSize,
    };
    const target = {
      x: this.gridPosition.col * this.cellSize,
      y: this.gridPosition.row * this.cellSize,
    };

    this.renderPosition = {
      x: start.x + (target.x - start.x) * this.travelProgress,
      y: start.y + (target.y - start.y) * this.travelProgress,
    };

    if (this.travelProgress >= 1) {
      this.state = ENTITY_STATES.IDLE;
      this.renderPosition = target;
    }
  }

  chooseDirection(level, bombSystem, player) {
    const availableDirections = Object.entries(DIRECTION_VECTORS)
      .filter(([, vector]) => this.canEnter(
        this.gridPosition.row + vector.row,
        this.gridPosition.col + vector.col,
        level,
        bombSystem
      ))
      .map(([direction]) => direction);

    if (!availableDirections.length) return null;

    const definition = this.definition;
    if (definition.pursuit !== 'none' && player?.canAct()) {
      const distance = Math.abs(player.gridPosition.row - this.gridPosition.row) +
        Math.abs(player.gridPosition.col - this.gridPosition.col);
      if (distance <= definition.radius && Math.random() < definition.chance) {
        if (definition.pursuit === 'route') {
          const direction = this.findPursuitDirection(level, bombSystem, player.gridPosition);
          if (direction) return direction;
        } else {
          const approaching = availableDirections.filter((direction) => {
            const vector = DIRECTION_VECTORS[direction];
            return Math.abs(player.gridPosition.row - this.gridPosition.row - vector.row) +
              Math.abs(player.gridPosition.col - this.gridPosition.col - vector.col) < distance;
          });
          if (approaching.length) return approaching[Math.floor(Math.random() * approaching.length)];
        }
      }
    }

    const filteredDirections =
      availableDirections.length > 1
        ? availableDirections.filter(
            (direction) => direction !== OPPOSITE_DIRECTIONS[this.direction]
          )
        : availableDirections;

    if (filteredDirections.includes(this.direction) && Math.random() < definition.straightChance) {
      return this.direction;
    }

    const index = Math.floor(Math.random() * filteredDirections.length);
    return filteredDirections[index];
  }

  canEnter(row, col, level, bombSystem) {
    const tile = level.getTile(row, col);
    return Boolean(tile && (level.isWalkable(row, col) ||
      (this.definition.wallPass && tile.type === TILE_TYPES.BREAKABLE)) &&
      !bombSystem.isBlockingTile(row, col));
  }

  findPursuitDirection(level, bombSystem, target) {
    const queue = [{ ...this.gridPosition, direction: null }];
    const visited = new Set([`${this.gridPosition.row},${this.gridPosition.col}`]);
    for (let index = 0; index < queue.length; index += 1) {
      const current = queue[index];
      if (current.row === target.row && current.col === target.col) return current.direction;
      for (const [direction, vector] of Object.entries(DIRECTION_VECTORS)) {
        const row = current.row + vector.row;
        const col = current.col + vector.col;
        const key = `${row},${col}`;
        if (visited.has(key) || !this.canEnter(row, col, level, bombSystem)) continue;
        visited.add(key);
        queue.push({ row, col, direction: current.direction || direction });
      }
    }
    return null;
  }

  beginMove(direction) {
    const vector = DIRECTION_VECTORS[direction];
    this.direction = direction;
    this.previousGridPosition = { ...this.gridPosition };
    this.gridPosition = {
      row: this.gridPosition.row + vector.row,
      col: this.gridPosition.col + vector.col,
    };
    this.travelProgress = 0;
    this.state = ENTITY_STATES.WALKING;
  }

  kill() {
    if (this.state === ENTITY_STATES.DYING || this.state === ENTITY_STATES.DEAD) {
      return;
    }

    this.state = ENTITY_STATES.DYING;
    this.deathTimer = ENEMY_SPRITES[this.species].deathDuration;
  }
}

window.EnemyController = EnemyController;

window.ENEMY_DEFINITIONS = ENEMY_DEFINITIONS;
window.getEnemyLineup = getEnemyLineup;
