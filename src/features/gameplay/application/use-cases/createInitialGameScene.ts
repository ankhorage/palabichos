import type { GameScene } from '../../../../types/gameplay';
import { createGameScene } from './createGameScene';

/*** Build the deterministic first scene shown before gameplay interaction begins. */
export function createInitialGameScene(): GameScene {
  return createGameScene(0);
}
