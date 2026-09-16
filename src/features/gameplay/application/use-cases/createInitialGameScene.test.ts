import { describe, expect, test } from 'bun:test';

import { createGameScene } from './createGameScene';
import { createInitialGameScene } from './createInitialGameScene';

describe('game scene creation', () => {
  test('starts the first animal category with mixed matching and distractor creatures', () => {
    const scene = createInitialGameScene();

    expect(scene.level.title).toBe('ANIMALES');
    expect(scene.levelIndex).toBe(0);
    expect(scene.phase).toBe('playing');
    expect(scene.level.targetCount).toBe(20);
    expect(scene.collectedCount).toBe(0);
    expect(scene.spawnSequence).toBe(0);
    expect(scene.creatures.some((creature) => creature.matchesTarget)).toBe(true);
    expect(scene.creatures.some((creature) => !creature.matchesTarget)).toBe(true);
  });

  test('builds COMIDA from the same data-driven scene boundary', () => {
    const scene = createGameScene(1);

    expect(scene.level.title).toBe('COMIDA');
    expect(scene.levelIndex).toBe(1);
    expect(scene.collectedCount).toBe(0);
    expect(scene.health).toBe(5);
    expect(scene.creatures.some((creature) => creature.word.text === 'manzana')).toBe(true);
    expect(scene.creatures.some((creature) => !creature.matchesTarget)).toBe(true);
  });
});
