import type { GameScene, GameplayConfig, GameplayConfigId } from '../../../../types/gameplay';
import type { VocabularyWord } from '../../../../types/vocabulary';
import { getVocabularyCategory } from '../../../vocabulary/application/use-cases/getVocabularyCategory';
import { getVocabularyWordsForCategory } from '../../../vocabulary/application/use-cases/getVocabularyWordsForCategory';
import { getVocabularyWordsOutsideCategory } from '../../../vocabulary/application/use-cases/getVocabularyWordsOutsideCategory';
import { GAMEPLAY_CONFIGS } from '../../constants/gameplayConfigs';
import { createCreatureViewModel } from './createCreatureViewModel';

/*** Build a fresh round for one selected vocabulary category. */
export function createGameScene(categoryId: string, levelIndex = 0): GameScene {
  const gameplayConfigId: GameplayConfigId = 'starter';
  const gameplayConfig = GAMEPLAY_CONFIGS.starter;
  const category = getVocabularyCategory(categoryId);
  const targetWords = getVocabularyWordsForCategory(categoryId);
  const distractorWords = getVocabularyWordsOutsideCategory(categoryId);

  if (targetWords.length < gameplayConfig.roundTargetCount) {
    throw new Error(
      `Category ${categoryId} requires at least ${gameplayConfig.roundTargetCount} target words.`,
    );
  }

  const initialWords = selectInitialWords(targetWords, distractorWords, gameplayConfig);
  const usedWordIds = initialWords.map((word) => word.id);
  const usedWordIdSet = new Set(usedWordIds);
  const remainingWords = [...targetWords, ...distractorWords].filter(
    (word) => !usedWordIdSet.has(word.id),
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
    creatures: initialWords.map((word, sequence) =>
      createCreatureViewModel(word, sequence, category.id),
    ),
    remainingWords,
    usedWordIds,
    spawnSequence: 0,
  };
}

interface InitialWordSelection {
  readonly words: readonly VocabularyWord[];
  readonly usedWordIds: readonly string[];
}

/*** Select the initial target/distractor mix without reusing a word id. */
function selectInitialWords(
  targetWords: readonly VocabularyWord[],
  distractorWords: readonly VocabularyWord[],
  config: GameplayConfig,
): readonly VocabularyWord[] {
  const selection = Array.from({
    length: config.initialCreatureCount,
  }).reduce<InitialWordSelection>(
    (state, _, sequence) => {
      const targetPreferred = prefersTarget(sequence, config);
      const word = selectUnusedWord(
        targetPreferred ? targetWords : distractorWords,
        targetPreferred ? distractorWords : targetWords,
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

/*** Pick the first unused word from a preferred pool with a deterministic fallback. */
function selectUnusedWord(
  preferred: readonly VocabularyWord[],
  fallback: readonly VocabularyWord[],
  usedWordIds: readonly string[],
): VocabularyWord {
  const word =
    preferred.find((candidate) => !usedWordIds.includes(candidate.id)) ??
    fallback.find((candidate) => !usedWordIds.includes(candidate.id));

  if (word === undefined) {
    throw new Error('Round vocabulary pool cannot fill the active creature set.');
  }

  return word;
}

/*** Return whether one spawn slot should favor a target word. */
function prefersTarget(sequence: number, config: GameplayConfig) {
  return sequence % config.spawnCycleLength < config.targetSpawnsPerCycle;
}
