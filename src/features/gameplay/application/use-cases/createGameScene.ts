import type { GameplayConfigId, GameScene } from '../../../../types/gameplay';
import { getVocabularyCategory } from '../../../vocabulary/application/use-cases/getVocabularyCategory';
import { getVocabularyWordsForCategory } from '../../../vocabulary/application/use-cases/getVocabularyWordsForCategory';
import { GAMEPLAY_CONFIGS } from '../../constants/gameplayConfigs';
import { createGameBoard } from './createGameBoard';

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
  if (targetWords.length < gameplayConfig.roundTargetCount) {
    throw new Error(
      `Category ${categoryId} requires at least ${gameplayConfig.roundTargetCount} target words.`,
    );
  }
  const resolvedWordIds: readonly string[] = [];
  const boardSequence = 0;
  const creatures = createGameBoard({
    targetCategoryId: category.id,
    config: gameplayConfig,
    presentationSeed,
    boardSequence,
    resolvedWordIds,
    previousWordIds: [],
  });

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
    resolvedWordIds,
    boardSequence,
    presentationSeed,
  };
}
