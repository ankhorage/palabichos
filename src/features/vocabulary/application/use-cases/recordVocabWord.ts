import type { VocabLibrary } from '../../../../types/vocabulary';

/*** Record one correct arcade resolution in the stable Vocab entry for that word. */
export function recordVocabWord(library: VocabLibrary, wordId: string): VocabLibrary {
  const existing = library.entries.find((entry) => entry.wordId === wordId);

  if (existing === undefined) {
    return {
      entries: [...library.entries, { wordId, correctResolutions: 1 }],
    };
  }

  return {
    entries: library.entries.map((entry) =>
      entry.wordId === wordId
        ? { ...entry, correctResolutions: entry.correctResolutions + 1 }
        : entry,
    ),
  };
}
