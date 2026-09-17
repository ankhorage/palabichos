import { describe, expect, test } from 'bun:test';

import { applyProjectileHit } from './applyProjectileHit';
import { createGameScene } from './createGameScene';

describe('applyProjectileHit', () => {
  test('removes configured health and resets the correct streak while vulnerable', () => {
    const scene = { ...createGameScene('animals'), correctStreak: 6 };
    const result = applyProjectileHit(scene, false);

    expect(result.damaged).toBe(true);
    expect(result.scene.health).toBe(4);
    expect(result.scene.correctStreak).toBe(0);
  });

  test('ignores additional hits during invulnerability', () => {
    const scene = createGameScene('animals');
    const result = applyProjectileHit(scene, true);

    expect(result.damaged).toBe(false);
    expect(result.scene).toBe(scene);
  });

  test('moves to game over when the final health point is lost', () => {
    const scene = { ...createGameScene('animals'), health: 1 };
    const result = applyProjectileHit(scene, false);

    expect(result.scene.health).toBe(0);
    expect(result.scene.phase).toBe('game-over');
  });
});
