import { useCallback, useState } from 'react';

import type { VocabLibrary } from '../../../../../types/vocabulary';
import { recordVocabWord } from '../../../application/use-cases/recordVocabWord';
import { loadVocabLibrary } from '../../outbound/browser/loadVocabLibrary';
import { saveVocabLibrary } from '../../outbound/browser/saveVocabLibrary';

/*** Own the browser-local Vocab library and expose stable correct-resolution capture. */
export function useVocabLibrary() {
  const [library, setLibrary] = useState<VocabLibrary>(loadVocabLibrary);
  const recordWord = useCallback((wordId: string) => {
    setLibrary((current) => {
      const next = recordVocabWord(current, wordId);
      saveVocabLibrary(next);
      return next;
    });
  }, []);

  return { library, recordWord };
}
