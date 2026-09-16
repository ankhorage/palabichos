import { describe, expect, test } from 'bun:test';

import { applyProjectileHit } from './applyProjectileHit';
import { createInitialGameScene } from './createInitialGameScene';

describe('applyProjectileHit', () => {
  test('removes exactly one health while vulnerable', () => {
    const scene = createInitialGameScene();
    const result = applyProjectileHit(scene, false);

    expect(result.damaged).toBe(true);
    expect(result.scene.health).toBe(4);
  });

  test('ignores additional hits during invulnerability', () => {
    const scene = createInitialGameScene();
    const result = applyProjectileHit(scene, true);

    expect(result.damaged).toBe(false);
    expect(result.scene).toBe(scene);
    expect(result.scene.health).toBe(5);
  });

  test('moves to game over when the final health point is lost', () => {
    const scene = { ...createInitialGameScene(), health: 1 };
    const result = applyProjectileHit(scene, false);

    expect(result.scene.health).toBe(0);
    expect(result.scene.phase).toBe('game-over');
  });
});
