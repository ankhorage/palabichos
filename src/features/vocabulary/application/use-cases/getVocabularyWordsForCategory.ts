import type { VocabularyWord } from '../../../../types/vocabulary';
import { VOCABULARY_WORDS } from '../../constants/words';

/*** Return every catalog word belonging to one category. */
export function getVocabularyWordsForCategory(categoryId: string): readonly VocabularyWord[] {
  return VOCABULARY_WORDS.filter((word) => word.categoryIds.includes(categoryId));
}
