import { describe, expect, test } from 'bun:test';

import { advanceGameScene } from './advanceGameScene';
import { createGameScene } from './createGameScene';
import { restartGameScene } from './restartGameScene';

describe('game lifecycle', () => {
  test('advances to another playable category without immediate repetition', () => {
    const completed = createGameScene('animals', 0, 0.75);
    const next = advanceGameScene(
      { ...completed, collectedCount: completed.level.targetCount, phase: 'level-complete' },
      0.25,
    );

    expect(next.level.targetCategoryId).not.toBe('animals');
    expect(next.levelIndex).toBe(1);
    expect(next.phase).toBe('playing');
    expect(next.collectedCount).toBe(0);
    expect(next.presentationSeed).toBe(0.25);
  });

  test('restarts the current category and resets round-local words without moving its layout', () => {
    const initial = createGameScene('food', 3, 0.75);
    const usedDuringRound = [...initial.usedWordIds, 'synthetic-used-word'];
    const restarted = restartGameScene({
      ...initial,
      collectedCount: 8,
      health: 0,
      phase: 'game-over',
      usedWordIds: usedDuringRound,
    });

    expect(restarted.level.targetCategoryId).toBe('food');
    expect(restarted.levelIndex).toBe(3);
    expect(restarted.phase).toBe('playing');
    expect(restarted.usedWordIds).toEqual(initial.usedWordIds);
    expect(restarted.health).toBe(restarted.gameplayConfig.startingHealth);
    expect(restarted.presentationSeed).toBe(0.75);
  });
});
