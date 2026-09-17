import type { GameScene } from '../../../../types/gameplay';
import { selectVocabularyCategory } from '../../../vocabulary/application/use-cases/selectVocabularyCategory';
import { GAMEPLAY_CONFIGS } from '../../constants/gameplayConfigs';
import { createGameScene } from './createGameScene';

/*** Build the first round from an explicitly supplied random value. */
export function createInitialGameScene(randomValue: number): GameScene {
  const config = GAMEPLAY_CONFIGS.starter;
  const category = selectVocabularyCategory(randomValue, config.roundTargetCount);
  return createGameScene(category.id, 0, randomValue);
}
