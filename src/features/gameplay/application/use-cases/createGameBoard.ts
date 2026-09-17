import type { CreatureViewModel, GameplayConfig } from '../../../../types/gameplay';
import type { VocabularyWord } from '../../../../types/vocabulary';
import { getVocabularyWordsForCategory } from '../../../vocabulary/application/use-cases/getVocabularyWordsForCategory';
import { getVocabularyWordsOutsideCategory } from '../../../vocabulary/application/use-cases/getVocabularyWordsOutsideCategory';
import { getDistractorCategoryId } from '../../utils/getDistractorCategoryId';
import { createCreatureViewModel } from './createCreatureViewModel';

/*** Build one fresh active answer board from unused and non-immediate-repeat vocabulary. */
export function createGameBoard(input: CreateGameBoardInput): readonly CreatureViewModel[] {
  const excludedWordIds = [...input.resolvedWordIds, ...input.previousWordIds];
  const targetWords = getVocabularyWordsForCategory(input.targetCategoryId).filter(
    (word) => !excludedWordIds.includes(word.id),
  );
  const distractorWords = getVocabularyWordsOutsideCategory(input.targetCategoryId).filter(
    (word) => !excludedWordIds.includes(word.id),
  );
  const distractorCount = input.config.initialCreatureCount - input.config.activeTargetCount;
  validatePools(targetWords, distractorWords, input.config.activeTargetCount, distractorCount);
  const targets = selectSeededWords(
    targetWords,
    input.config.activeTargetCount,
    input.presentationSeed,
  );
  const distractors = selectDiverseDistractors(
    distractorWords,
    distractorCount,
    input.targetCategoryId,
    deriveSeed(input.presentationSeed, 0.37),
  );
  const orderedWords = arrangeBoardWords(targets, distractors, input.config, input.presentationSeed);

  return createCreatures(orderedWords, input);
}

interface CreateGameBoardInput {
  readonly targetCategoryId: string;
  readonly config: GameplayConfig;
  readonly presentationSeed: number;
  readonly boardSequence: number;
  readonly resolvedWordIds: readonly string[];
  readonly previousWordIds: readonly string[];
}

/*** Validate that one fresh board can satisfy its exact target and distractor counts. */
function validatePools(
  targetWords: readonly VocabularyWord[],
  distractorWords: readonly VocabularyWord[],
  targetCount: number,
  distractorCount: number,
) {
  if (targetCount <= 0 || distractorCount <= 0) {
    throw new Error('Gameplay active mix requires both targets and distractors.');
  }
  if (targetWords.length < targetCount || distractorWords.length < distractorCount) {
    throw new Error('Round vocabulary pool cannot fill a fresh answer board.');
  }
}

/*** Select a fixed number of words after rotating one pool by an explicit random seed. */
function selectSeededWords(
  words: readonly VocabularyWord[],
  count: number,
  seed: number,
): readonly VocabularyWord[] {
  return rotateWordsBySeed(words, seed).slice(0, count);
}

/*** Prefer distractors from different non-target categories before using any fallback words. */
function selectDiverseDistractors(
  words: readonly VocabularyWord[],
  count: number,
  targetCategoryId: string,
  seed: number,
): readonly VocabularyWord[] {
  const rotated = rotateWordsBySeed(words, seed);
  const diverse = rotated.reduce<readonly VocabularyWord[]>((selected, word) => {
    if (selected.length >= count) return selected;
    const categoryId = getDistractorCategoryId(word, targetCategoryId);
    const selectedCategoryIds = selected.flatMap((candidate) => {
      const selectedCategoryId = getDistractorCategoryId(candidate, targetCategoryId);
      return selectedCategoryId === null ? [] : [selectedCategoryId];
    });
    return categoryId !== null && !selectedCategoryIds.includes(categoryId)
      ? [...selected, word]
      : selected;
  }, []);
  if (diverse.length >= count) return diverse.slice(0, count);

  return rotated.reduce<readonly VocabularyWord[]>(
    (selected, word) =>
      selected.length >= count || selected.some((candidate) => candidate.id === word.id)
        ? selected
        : [...selected, word],
    diverse,
  );
}

/*** Arrange the exact target/distractor mix and rotate it so target slots are not predictable. */
function arrangeBoardWords(
  targets: readonly VocabularyWord[],
  distractors: readonly VocabularyWord[],
  config: GameplayConfig,
  seed: number,
): readonly VocabularyWord[] {
  const words = Array.from({ length: config.initialCreatureCount }).map((_, sequence) => {
    const targetsBefore = Math.floor((sequence * config.activeTargetCount) / config.initialCreatureCount);
    const targetsAfter = Math.floor(
      ((sequence + 1) * config.activeTargetCount) / config.initialCreatureCount,
    );
    const word =
      targetsAfter > targetsBefore
        ? targets.at(targetsBefore)
        : distractors.at(sequence - targetsBefore);
    if (word === undefined) throw new Error('Fresh answer board selection is incomplete.');
    return word;
  });

  return rotateWordsBySeed(words, deriveSeed(seed, 0.73));
}

/*** Build collision-safe creature view models for one fully refreshed board. */
function createCreatures(
  words: readonly VocabularyWord[],
  input: CreateGameBoardInput,
): readonly CreatureViewModel[] {
  const sequenceBase = input.boardSequence * input.config.initialCreatureCount;
  return words.reduce<readonly CreatureViewModel[]>((creatures, word, index) => {
    const creature = createCreatureViewModel(
      word,
      sequenceBase + index,
      input.targetCategoryId,
      deriveSeed(input.presentationSeed, input.boardSequence * 0.17),
      creatures,
      input.config.creatureMinimumDistancePercent,
    );
    return [...creatures, creature];
  }, []);
}

/*** Rotate one readonly word pool from a seed-derived start without mutating it. */
function rotateWordsBySeed(
  words: readonly VocabularyWord[],
  seed: number,
): readonly VocabularyWord[] {
  if (words.length === 0) return words;
  const offset = Math.floor(normalizeSeed(seed) * words.length);
  return [...words.slice(offset), ...words.slice(0, offset)];
}

/*** Derive another normalized seed from one boundary-supplied random value. */
function deriveSeed(seed: number, offset: number) {
  return normalizeSeed(seed + offset);
}

/*** Normalize arbitrary numeric input to the deterministic half-open random interval. */
function normalizeSeed(seed: number) {
  const finiteSeed = Number.isFinite(seed) ? seed : 0;
  return ((finiteSeed % 1) + 1) % 1;
}
