import { describe, expect, test } from 'bun:test';

import { recordVocabWord } from './recordVocabWord';

describe('recordVocabWord', () => {
  test('creates one stable Vocab entry and increments later correct resolutions', () => {
    const first = recordVocabWord({ entries: [] }, 'animals-gato');
    const second = recordVocabWord(first, 'animals-gato');

    expect(first.entries).toEqual([{ wordId: 'animals-gato', correctResolutions: 1 }]);
    expect(second.entries).toEqual([{ wordId: 'animals-gato', correctResolutions: 2 }]);
  });

  test('keeps different resolved words as separate entries', () => {
    const first = recordVocabWord({ entries: [] }, 'animals-gato');
    const second = recordVocabWord(first, 'food-pan');

    expect(second.entries).toHaveLength(2);
  });
});
