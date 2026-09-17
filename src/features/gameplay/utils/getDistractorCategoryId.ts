import type { VocabularyWord } from '../../../types/vocabulary';

/*** Return the first non-target category that can represent one distractor word. */
export function getDistractorCategoryId(
  word: VocabularyWord,
  targetCategoryId: string,
): string | null {
  return word.categoryIds.find((categoryId) => categoryId !== targetCategoryId) ?? null;
}
