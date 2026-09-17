import type { VocabularyCategoryId, VocabularyWord } from '../../../../types/vocabulary';
import { VOCABULARY_WORDS } from '../../constants/words';

/*** Return catalog words that do not belong to the selected target category. */
export function getVocabularyWordsOutsideCategory(
  categoryId: VocabularyCategoryId,
): readonly VocabularyWord[] {
  return VOCABULARY_WORDS.filter((word) => !belongsToCategory(word, categoryId));
}

/*** Check category membership through the public vocabulary word shape. */
function belongsToCategory(word: VocabularyWord, categoryId: VocabularyCategoryId) {
  return word.categoryIds.includes(categoryId);
}
