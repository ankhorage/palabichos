import type { GameScene } from '../../../../types/gameplay';
import { FIRST_LEVEL } from '../../constants/levels';

/*** Build the deterministic first scene shown before gameplay interaction begins. */
export function createInitialGameScene(): GameScene {
  return {
    level: FIRST_LEVEL,
    collectedCount: 0,
    health: 5,
    creatures: FIRST_LEVEL.initialCreatures.map((creature) => ({
      ...creature,
      matchesTarget: creature.word.categories.includes(FIRST_LEVEL.targetCategory),
    })),
  };
}
