import { describe, expect, test } from 'bun:test';

import { createCreatureResolution } from './createCreatureResolution';
import { createGameScene } from './createGameScene';

describe('createCreatureResolution', () => {
  test('derives correctness from category membership and the selected action', () => {
    const scene = createGameScene('animals');
    const target = scene.creatures.find((creature) => creature.matchesTarget);
    const distractor = scene.creatures.find((creature) => !creature.matchesTarget);

    expect(target).toBeDefined();
    expect(distractor).toBeDefined();
    if (target === undefined || distractor === undefined) return;

    expect(createCreatureResolution(target, 'collect', 1).isCorrect).toBe(true);
    expect(createCreatureResolution(target, 'shoot', 2).isCorrect).toBe(false);
    expect(createCreatureResolution(distractor, 'shoot', 3).isCorrect).toBe(true);
    expect(createCreatureResolution(distractor, 'collect', 4).isCorrect).toBe(false);
  });
});
