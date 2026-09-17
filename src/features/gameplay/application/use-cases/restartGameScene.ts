import type { GameScene } from '../../../../types/gameplay';
import { createGameScene } from './createGameScene';

/*** Restart the current category as a fresh round with reset round-local word usage. */
export function restartGameScene(scene: GameScene): GameScene {
  return createGameScene(scene.level.targetCategoryId, scene.levelIndex);
}
