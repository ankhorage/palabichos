import type { GameScene } from '../../../../types/gameplay';
import { createGameScene } from './createGameScene';

/*** Restart the current category while preserving the active category-cycle history. */
export function restartGameScene(scene: GameScene): GameScene {
  return createGameScene(
    scene.level.targetCategoryId,
    scene.levelIndex,
    scene.presentationSeed,
    scene.playedCategoryIds,
  );
}
