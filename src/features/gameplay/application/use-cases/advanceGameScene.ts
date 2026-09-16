import type { GameScene } from '../../../../types/gameplay';
import { GAME_LEVELS } from '../../constants/levels';
import { createGameScene } from './createGameScene';

/*** Advance a completed scene to the next catalog level, wrapping after the last level. */
export function advanceGameScene(scene: GameScene): GameScene {
  const nextLevelIndex = (scene.levelIndex + 1) % GAME_LEVELS.length;
  return createGameScene(nextLevelIndex);
}
