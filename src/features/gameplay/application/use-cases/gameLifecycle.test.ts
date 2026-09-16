import { describe, expect, test } from 'bun:test';

import { advanceGameScene } from './advanceGameScene';
import { createGameScene } from './createGameScene';
import { restartGameScene } from './restartGameScene';

describe('game lifecycle', () => {
  test('advances ANIMALES to a fresh COMIDA scene', () => {
    const completed = createGameScene(0);
    const next = advanceGameScene({ ...completed, collectedCount: 20, phase: 'level-complete' });

    expect(next.level.title).toBe('COMIDA');
    expect(next.levelIndex).toBe(1);
    expect(next.phase).toBe('playing');
    expect(next.collectedCount).toBe(0);
    expect(next.health).toBe(5);
  });

  test('restarts the current level with fresh state', () => {
    const failed = createGameScene(1);
    const restarted = restartGameScene({
      ...failed,
      collectedCount: 8,
      health: 0,
      phase: 'game-over',
    });

    expect(restarted.level.title).toBe('COMIDA');
    expect(restarted.levelIndex).toBe(1);
    expect(restarted.phase).toBe('playing');
    expect(restarted.collectedCount).toBe(0);
    expect(restarted.health).toBe(5);
  });
});
