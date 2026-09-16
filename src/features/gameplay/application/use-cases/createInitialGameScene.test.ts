import { describe, expect, test } from 'bun:test';
import { createInitialGameScene } from './createInitialGameScene';

describe('createInitialGameScene', () => {
  test('creates the first relaxed category task with matching and distracting words', () => {
    const scene = createInitialGameScene();
    const matchingCreatures = scene.creatures.filter((creature) => creature.matchesTarget);
    const distractingCreatures = scene.creatures.filter((creature) => !creature.matchesTarget);

    expect(scene.level.title).toBe('ANIMALES');
    expect(scene.level.targetCount).toBe(20);
    expect(scene.collectedCount).toBe(0);
    expect(scene.health).toBe(5);
    expect(matchingCreatures.length).toBeGreaterThan(0);
    expect(distractingCreatures.length).toBeGreaterThan(0);
  });
});
