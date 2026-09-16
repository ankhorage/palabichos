import type { GameScene } from '../../../../types/gameplay';
import { GAME_LEVELS } from '../../constants/levels';

/*** Build a fresh deterministic gameplay scene for one catalog level. */
export function createGameScene(levelIndex: number): GameScene {
  const level = GAME_LEVELS.find((candidate) => candidate.number === levelIndex + 1);

  if (level === undefined) {
    throw new Error(`Unknown Palabichos level index ${levelIndex}.`);
  }

  return {
    level,
    levelIndex,
    phase: 'playing',
    collectedCount: 0,
    health: 5,
    creatures: level.initialCreatures.map((creature) => ({
      ...creature,
      matchesTarget: creature.word.categories.includes(level.targetCategory),
    })),
    spawnSequence: 0,
  };
}
