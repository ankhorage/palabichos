import type { GameScene } from '../../../../types/gameplay';
import { selectVocabularyCategory } from '../../../vocabulary/application/use-cases/selectVocabularyCategory';
import { createGameScene } from './createGameScene';

/*** Advance to a randomly selected playable category and presentation layout. */
export function advanceGameScene(scene: GameScene, randomValue: number): GameScene {
  const category = selectVocabularyCategory(
    randomValue,
    scene.gameplayConfig.roundTargetCount,
    scene.level.targetCategoryId,
  );
  return createGameScene(category.id, scene.levelIndex + 1, randomValue);
}
