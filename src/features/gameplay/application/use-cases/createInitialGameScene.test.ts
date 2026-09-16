import { describe, expect, test } from 'bun:test';

import { createInitialGameScene } from './createInitialGameScene';

describe('createInitialGameScene', () => {
  test('starts the first animal category with mixed matching and distractor creatures', () => {
    const scene = createInitialGameScene();

    expect(scene.level.title).toBe('ANIMALES');
    expect(scene.level.targetCount).toBe(20);
    expect(scene.collectedCount).toBe(0);
    expect(scene.spawnSequence).toBe(0);
    expect(scene.creatures.some((creature) => creature.matchesTarget)).toBe(true);
    expect(scene.creatures.some((creature) => !creature.matchesTarget)).toBe(true);
  });
});
