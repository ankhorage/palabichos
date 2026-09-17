import { describe, expect, test } from 'bun:test';

import { createCreatureResolution } from './createCreatureResolution';
import { createGameScene } from './createGameScene';

describe('createCreatureResolution', () => {
  test('marks target shots correct and distractor shots wrong', () => {
    const scene = createGameScene('animals');
    const target = scene.creatures.find((creature) => creature.matchesTarget);
    const distractor = scene.creatures.find((creature) => !creature.matchesTarget);

    expect(target).toBeDefined();
    expect(distractor).toBeDefined();
    if (target === undefined || distractor === undefined) return;

    const targetResolution = createCreatureResolution(target, 'shoot', 1);
    const distractorResolution = createCreatureResolution(distractor, 'shoot', 2);

    expect(targetResolution.isCorrect).toBe(true);
    expect(targetResolution.action).toBe('shoot');
    expect(distractorResolution.isCorrect).toBe(false);
    expect(distractorResolution.action).toBe('shoot');
  });
});
