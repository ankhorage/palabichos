import type { VocabLibrary } from '../../../../../types/vocabulary';

/*** Load the browser-local Vocab library, falling back safely when storage is absent or invalid. */
export function loadVocabLibrary(): VocabLibrary {
  const raw = window.localStorage.getItem(VOCAB_STORAGE_KEY);
  if (raw === null) return EMPTY_LIBRARY;

  try {
    const parsed: unknown = JSON.parse(raw);
    return isVocabLibrary(parsed) ? parsed : EMPTY_LIBRARY;
  } catch {
    return EMPTY_LIBRARY;
  }
}

const VOCAB_STORAGE_KEY = 'palabichos:vocab';
const EMPTY_LIBRARY: VocabLibrary = { entries: [] };

/*** Validate the small persisted Vocab shape without trusting browser storage. */
function isVocabLibrary(value: unknown): value is VocabLibrary {
  if (typeof value !== 'object' || value === null || !('entries' in value)) return false;
  return Array.isArray(value.entries) && value.entries.every(isVocabEntry);
}

/*** Validate one persisted Vocab entry. */
function isVocabEntry(value: unknown) {
  return (
    typeof value === 'object' &&
    value !== null &&
    'wordId' in value &&
    typeof value.wordId === 'string' &&
    'correctResolutions' in value &&
    typeof value.correctResolutions === 'number'
  );
}
