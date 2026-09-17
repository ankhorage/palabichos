import type { VocabularyWord } from '../../../../types/vocabulary';
import { VOCABULARY_WORDS } from '../../constants/words';

/*** Return catalog words that do not belong to the selected target category. */
export function getVocabularyWordsOutsideCategory(categoryId: string): readonly VocabularyWord[] {
  return VOCABULARY_WORDS.filter((word) => !word.categoryIds.includes(categoryId));
}
