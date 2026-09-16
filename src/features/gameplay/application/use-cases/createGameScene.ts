import type { GameScene } from '../../../../types/gameplay';
import { GAMEPLAY_CONFIGS } from '../../constants/gameplayConfigs';
import { GAME_LEVELS } from '../../constants/levels';

/*** Build a fresh deterministic gameplay scene for one catalog level. */
export function createGameScene(levelIndex: number): GameScene {
  const level = GAME_LEVELS.find((candidate) => candidate.number === levelIndex + 1);

  if (level === undefined) {
    throw new Error(`Unknown Palabichos level index ${levelIndex}.`);
  }

  const gameplayConfig = GAMEPLAY_CONFIGS[level.gameplayConfigId];

  return {
    level,
    gameplayConfig,
    levelIndex,
    phase: 'playing',
    collectedCount: 0,
    correctStreak: 0,
    health: gameplayConfig.startingHealth,
    creatures: level.initialCreatures.map((creature) => ({
      ...creature,
      matchesTarget: creature.word.categories.includes(level.targetCategory),
    })),
    spawnSequence: 0,
  };
}
