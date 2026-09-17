import { describe, expect, test } from 'bun:test';

import type { GameScene } from '../../../../types/gameplay';
import { getPlayableVocabularyCategories } from '../../../vocabulary/application/use-cases/getPlayableVocabularyCategories';
import { advanceGameScene } from './advanceGameScene';
import { createGameScene } from './createGameScene';
import { restartGameScene } from './restartGameScene';

describe('game lifecycle category cycles', () => {
  test('plays every playable category once before starting a new category cycle', () => {
    const initial = createGameScene('animals', 0, 0.75);
    const playable = getPlayableVocabularyCategories(initial.gameplayConfig.roundTargetCount);
    const cycleScenes = Array.from({ length: playable.length - 1 }).reduce<readonly GameScene[]>(
      (scenes) => {
        const current = scenes.at(-1) ?? initial;
        return [...scenes, advanceGameScene(completeScene(current), 0)];
      },
      [],
    );
    const categoryIds = [initial, ...cycleScenes].map((scene) => scene.level.targetCategoryId);
    const finalScene = cycleScenes.at(-1) ?? initial;

    expect(playable).toHaveLength(16);
    expect(categoryIds).toHaveLength(playable.length);
    expect(new Set(categoryIds).size).toBe(playable.length);
    expect(finalScene.playedCategoryIds).toHaveLength(playable.length);
    expect(new Set(finalScene.playedCategoryIds).size).toBe(playable.length);
  });

  test('starts a fresh cycle without immediately repeating the completed category', () => {
    const initial = createGameScene('animals', 0, 0.75);
    const playable = getPlayableVocabularyCategories(initial.gameplayConfig.roundTargetCount);
    const finalScene = Array.from({ length: playable.length - 1 }).reduce<GameScene>(
      (scene) => advanceGameScene(completeScene(scene), 0),
      initial,
    );
    const nextCycle = advanceGameScene(completeScene(finalScene), 0);

    expect(nextCycle.level.targetCategoryId).not.toBe(finalScene.level.targetCategoryId);
    expect(nextCycle.playedCategoryIds).toEqual([nextCycle.level.targetCategoryId]);
    expect(nextCycle.levelIndex).toBe(playable.length);
  });
});

describe('game lifecycle restart', () => {
  test('restarts the current category and preserves its category-cycle history', () => {
    const initial = createGameScene('food', 3, 0.75, ['animals', 'food']);
    const restarted = restartGameScene({
      ...initial,
      collectedCount: 8,
      health: 0,
      phase: 'game-over',
      resolvedWordIds: ['synthetic-resolved-word'],
      boardSequence: 4,
    });

    expect(restarted.level.targetCategoryId).toBe('food');
    expect(restarted.levelIndex).toBe(3);
    expect(restarted.playedCategoryIds).toEqual(['animals', 'food']);
    expect(restarted.phase).toBe('playing');
    expect(restarted.resolvedWordIds).toEqual([]);
    expect(restarted.boardSequence).toBe(0);
    expect(restarted.health).toBe(restarted.gameplayConfig.startingHealth);
    expect(restarted.presentationSeed).toBe(0.75);
    expect(restarted.creatures).toEqual(initial.creatures);
  });
});

function completeScene(scene: GameScene): GameScene {
  return { ...scene, collectedCount: scene.level.targetCount, phase: 'level-complete' };
}
