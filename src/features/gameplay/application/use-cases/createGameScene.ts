import type {
  CreatureViewModel,
  GameplayConfig,
  GameplayConfigId,
  GameScene,
} from '../../../../types/gameplay';
import type { VocabularyWord } from '../../../../types/vocabulary';
import { getVocabularyCategory } from '../../../vocabulary/application/use-cases/getVocabularyCategory';
import { getVocabularyWordsForCategory } from '../../../vocabulary/application/use-cases/getVocabularyWordsForCategory';
import { getVocabularyWordsOutsideCategory } from '../../../vocabulary/application/use-cases/getVocabularyWordsOutsideCategory';
import { GAMEPLAY_CONFIGS } from '../../constants/gameplayConfigs';
import { createCreatureViewModel } from './createCreatureViewModel';

/*** Build a fresh round for one selected vocabulary category and presentation seed. */
export function createGameScene(
  categoryId: string,
  levelIndex = 0,
  presentationSeed = 0,
): GameScene {
  const gameplayConfigId: GameplayConfigId = 'starter';
  const gameplayConfig = GAMEPLAY_CONFIGS.starter;
  const category = getVocabularyCategory(categoryId);
  const targetWords = getVocabularyWordsForCategory(categoryId);
  const distractorWords = diversifyDistractorWords(
    getVocabularyWordsOutsideCategory(categoryId),
    categoryId,
  );

  validateRoundPools(categoryId, targetWords, distractorWords, gameplayConfig);

  const initialWords = selectInitialWords(targetWords, distractorWords, gameplayConfig);
  const usedWordIds = initialWords.map((word) => word.id);
  const usedWordIdSet = new Set(usedWordIds);
  const remainingWords = [...targetWords, ...distractorWords].filter(
    (word) => !usedWordIdSet.has(word.id),
  );
  const creatures = createInitialCreatures(
    initialWords,
    category.id,
    presentationSeed,
    gameplayConfig,
  );

  return {
    level: {
      id: `${category.id}-${levelIndex + 1}`,
      number: levelIndex + 1,
      title: category.title,
      targetCategoryId: category.id,
      targetCount: gameplayConfig.roundTargetCount,
      gameplayConfigId,
    },
    gameplayConfig,
    levelIndex,
    phase: 'playing',
    collectedCount: 0,
    correctStreak: 0,
    health: gameplayConfig.startingHealth,
    creatures,
    remainingWords,
    usedWordIds,
    spawnSequence: 0,
    presentationSeed,
  };
}

/*** Validate that one round has enough target and distractor vocabulary for its active mix. */
function validateRoundPools(
  categoryId: string,
  targetWords: readonly VocabularyWord[],
  distractorWords: readonly VocabularyWord[],
  config: GameplayConfig,
) {
  const activeDistractorCount = config.initialCreatureCount - config.activeTargetCount;
  if (targetWords.length < config.roundTargetCount) {
    throw new Error(
      `Category ${categoryId} requires at least ${config.roundTargetCount} target words.`,
    );
  }
  if (config.activeTargetCount <= 0 || activeDistractorCount <= 0) {
    throw new Error('Gameplay active mix requires both targets and distractors.');
  }
  if (
    targetWords.length < config.activeTargetCount ||
    distractorWords.length < activeDistractorCount
  ) {
    throw new Error('Round vocabulary pool cannot fill the configured active creature mix.');
  }
}

interface InitialWordSelection {
  readonly words: readonly VocabularyWord[];
  readonly usedWordIds: readonly string[];
}

/*** Select the configured initial target/distractor mix without reusing a word id. */
function selectInitialWords(
  targetWords: readonly VocabularyWord[],
  distractorWords: readonly VocabularyWord[],
  config: GameplayConfig,
): readonly VocabularyWord[] {
  const selection = Array.from({ length: config.initialCreatureCount }).reduce<InitialWordSelection>(
    (state, _, sequence) => {
      const targetPreferred = shouldSelectTarget(sequence, config);
      const word = selectUnusedWord(
        targetPreferred ? targetWords : distractorWords,
        state.usedWordIds,
      );

      return {
        words: [...state.words, word],
        usedWordIds: [...state.usedWordIds, word.id],
      };
    },
    { words: [], usedWordIds: [] },
  );

  return selection.words;
}

/*** Spread the configured target count evenly through the initial creature sequence. */
function shouldSelectTarget(sequence: number, config: GameplayConfig) {
  const targetsBefore = Math.floor(
    (sequence * config.activeTargetCount) / config.initialCreatureCount,
  );
  const targetsAfter = Math.floor(
    ((sequence + 1) * config.activeTargetCount) / config.initialCreatureCount,
  );
  return targetsAfter > targetsBefore;
}

/*** Pick the first unused word from one required answer-class pool. */
function selectUnusedWord(
  words: readonly VocabularyWord[],
  usedWordIds: readonly string[],
): VocabularyWord {
  const word = words.find((candidate) => !usedWordIds.includes(candidate.id));
  if (word === undefined) {
    throw new Error('Round vocabulary pool cannot fill the active creature set.');
  }
  return word;
}

/*** Interleave non-target words by category so distractors span many vocabulary topics. */
function diversifyDistractorWords(
  words: readonly VocabularyWord[],
  targetCategoryId: string,
): readonly VocabularyWord[] {
  const categoryIds = words
    .flatMap((word) => word.categoryIds.filter((categoryId) => categoryId !== targetCategoryId))
    .filter((categoryId, index, all) => all.indexOf(categoryId) === index);
  const maxCategorySize = Math.max(
    0,
    ...categoryIds.map(
      (categoryId) => words.filter((word) => word.categoryIds.includes(categoryId)).length,
    ),
  );
  const interleaved = Array.from({ length: maxCategorySize }).flatMap((_, wordIndex) =>
    categoryIds.flatMap((categoryId) => {
      const word = words.filter((candidate) => candidate.categoryIds.includes(categoryId))[wordIndex];
      return word === undefined ? [] : [word];
    }),
  );

  return interleaved.reduce<readonly VocabularyWord[]>(
    (unique, word) => (unique.some((candidate) => candidate.id === word.id) ? unique : [...unique, word]),
    [],
  );
}

/*** Build the initial readable creature layout while preserving the selected word sequence. */
function createInitialCreatures(
  words: readonly VocabularyWord[],
  targetCategoryId: string,
  presentationSeed: number,
  config: GameplayConfig,
): readonly CreatureViewModel[] {
  return words.reduce<readonly CreatureViewModel[]>((creatures, word, sequence) => {
    const creature = createCreatureViewModel(
      word,
      sequence,
      targetCategoryId,
      presentationSeed,
      creatures,
      config.creatureMinimumDistancePercent,
    );
    return [...creatures, creature];
  }, []);
}
