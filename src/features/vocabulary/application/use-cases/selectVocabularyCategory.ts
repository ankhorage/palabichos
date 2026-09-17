import type { VocabularyCategory } from '../../../../types/vocabulary';
import { getPlayableVocabularyCategories } from './getPlayableVocabularyCategories';

/*** Select one playable category from a deterministic random value. */
export function selectVocabularyCategory(
  randomValue: number,
  minimumWordCount: number,
  excludedCategoryId: string | null = null,
): VocabularyCategory {
  const playable = getPlayableVocabularyCategories(minimumWordCount);
  const candidates =
    excludedCategoryId === null || playable.length <= 1
      ? playable
      : playable.filter((category) => category.id !== excludedCategoryId);

  if (candidates.length === 0) {
    throw new Error(`No vocabulary category has ${minimumWordCount} playable words.`);
  }

  const boundedRandom = Math.min(0.999999999, Math.max(0, randomValue));
  const category = candidates[Math.floor(boundedRandom * candidates.length)];

  if (category === undefined) {
    throw new Error('Unable to select a playable vocabulary category.');
  }

  return category;
}
