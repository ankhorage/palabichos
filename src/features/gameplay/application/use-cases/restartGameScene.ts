import type { GameScene } from '../../../../types/gameplay';
import { createGameScene } from './createGameScene';

/*** Restart the current category with fresh words while preserving its presentation layout. */
export function restartGameScene(scene: GameScene): GameScene {
  return createGameScene(scene.level.targetCategoryId, scene.levelIndex, scene.presentationSeed);
}
