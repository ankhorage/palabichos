import type { VocabLibrary } from '../../../../../types/vocabulary';

/*** Persist the current Vocab library in browser-local storage. */
export function saveVocabLibrary(library: VocabLibrary): void {
  window.localStorage.setItem('palabichos:vocab', JSON.stringify(library));
}
