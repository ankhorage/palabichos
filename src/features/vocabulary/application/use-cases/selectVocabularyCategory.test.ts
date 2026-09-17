import { describe, expect, test } from 'bun:test';

import { selectVocabularyCategory } from './selectVocabularyCategory';

describe('selectVocabularyCategory', () => {
  test('selects deterministically from the playable catalog', () => {
    const first = selectVocabularyCategory(0, 20);
    const last = selectVocabularyCategory(0.999999, 20);

    expect(first.id).not.toBe(last.id);
  });

  test('excludes every category already played in the current cycle', () => {
    const first = selectVocabularyCategory(0, 20);
    const second = selectVocabularyCategory(0, 20, [first.id]);
    const third = selectVocabularyCategory(0, 20, [first.id, second.id]);

    expect(new Set([first.id, second.id, third.id]).size).toBe(3);
  });
});
