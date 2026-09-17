import type { VocabularyCategory } from '../../../../types/vocabulary';
import { VOCABULARY_CATEGORIES } from '../../constants/categories';

/*** Resolve one category by stable id. */
export function getVocabularyCategory(categoryId: string): VocabularyCategory {
  const category = VOCABULARY_CATEGORIES.find((candidate) => candidate.id === categoryId);

  if (category === undefined) {
    throw new Error(`Unknown vocabulary category ${categoryId}.`);
  }

  return category;
}
