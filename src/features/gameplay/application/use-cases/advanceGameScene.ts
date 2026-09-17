import type { GameScene } from '../../../../types/gameplay';
import { getPlayableVocabularyCategories } from '../../../vocabulary/application/use-cases/getPlayableVocabularyCategories';
import { selectVocabularyCategory } from '../../../vocabulary/application/use-cases/selectVocabularyCategory';
import { createGameScene } from './createGameScene';

/*** Advance to a fresh playable category without repeating one inside the current cycle. */
export function advanceGameScene(scene: GameScene, randomValue: number): GameScene {
  const playable = getPlayableVocabularyCategories(scene.gameplayConfig.roundTargetCount);
  const cycleComplete = playable.every((category) => scene.playedCategoryIds.includes(category.id));
  const excludedCategoryIds = cycleComplete
    ? playable.length > 1
      ? [scene.level.targetCategoryId]
      : []
    : scene.playedCategoryIds;
  const category = selectVocabularyCategory(
    randomValue,
    scene.gameplayConfig.roundTargetCount,
    excludedCategoryIds,
  );
  const playedCategoryIds = cycleComplete
    ? [category.id]
    : [...scene.playedCategoryIds, category.id];

  return createGameScene(category.id, scene.levelIndex + 1, randomValue, playedCategoryIds);
}
