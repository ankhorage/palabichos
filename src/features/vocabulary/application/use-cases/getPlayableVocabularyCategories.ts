import type {
  VocabularyCategory,
  VocabularyCategoryId,
  VocabularyWord,
} from '../../../../types/vocabulary';
import { VOCABULARY_CATEGORIES } from '../../constants/categories';
import { VOCABULARY_WORDS } from '../../constants/words';

/*** Return categories with enough unique target words to complete one round. */
export function getPlayableVocabularyCategories(
  minimumWordCount: number,
): readonly VocabularyCategory[] {
  return VOCABULARY_CATEGORIES.filter(
    (category) => countWordsForCategory(category.id) >= minimumWordCount,
  );
}

/*** Count catalog words through the public vocabulary word shape. */
function countWordsForCategory(categoryId: VocabularyCategoryId) {
  return VOCABULARY_WORDS.filter((word) => belongsToCategory(word, categoryId)).length;
}

/*** Check category membership through the public vocabulary word shape. */
function belongsToCategory(word: VocabularyWord, categoryId: VocabularyCategoryId) {
  return word.categoryIds.includes(categoryId);
}
