import type { GameScene } from '../../../../types/gameplay';
import { createGameScene } from './createGameScene';

/*** Rebuild the current catalog level with fresh health, progress, and creatures. */
export function restartGameScene(scene: GameScene): GameScene {
  return createGameScene(scene.levelIndex);
}
