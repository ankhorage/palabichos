import { describe, expect, test } from 'bun:test';

import { selectVocabularyCategory } from './selectVocabularyCategory';

describe('selectVocabularyCategory', () => {
  test('selects deterministically from the playable catalog', () => {
    const first = selectVocabularyCategory(0, 20);
    const last = selectVocabularyCategory(0.999999, 20);

    expect(first.id).not.toBe(last.id);
  });

  test('excludes the completed category when another playable category exists', () => {
    const first = selectVocabularyCategory(0, 20);
    const next = selectVocabularyCategory(0, 20, first.id);

    expect(next.id).not.toBe(first.id);
  });
});
