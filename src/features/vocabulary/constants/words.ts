import type { VocabularyWord } from '../../../types/vocabulary';
import { CORE_VOCABULARY_WORDS } from './words/core';
import { PEOPLE_VOCABULARY_WORDS } from './words/people';
import { PLACES_VOCABULARY_WORDS } from './words/places';
import { WORLD_VOCABULARY_WORDS } from './words/world';

/*** Define the starter Spanish-to-German vocabulary catalog. */
export const VOCABULARY_WORDS: readonly VocabularyWord[] = [
  ...CORE_VOCABULARY_WORDS,
  ...PEOPLE_VOCABULARY_WORDS,
  ...PLACES_VOCABULARY_WORDS,
  ...WORLD_VOCABULARY_WORDS,
];
