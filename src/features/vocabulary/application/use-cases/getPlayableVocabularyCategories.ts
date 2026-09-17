import type { VocabularyCategory } from '../../../../types/vocabulary';
import { VOCABULARY_CATEGORIES } from '../../constants/categories';
import { VOCABULARY_WORDS } from '../../constants/words';

/*** Return categories with enough unique target words to complete one round. */
export function getPlayableVocabularyCategories(
  minimumWordCount: number,
): readonly VocabularyCategory[] {
  return VOCABULARY_CATEGORIES.filter(
    (category) =>
      VOCABULARY_WORDS.filter((word) => word.categoryIds.includes(category.id)).length >=
      minimumWordCount,
  );
}
