import { describe, expect, test } from 'bun:test';

import { createCreatureResolution } from './createCreatureResolution';
import { createInitialGameScene } from './createInitialGameScene';

describe('createCreatureResolution', () => {
  test('reports semantic truth independently from the chosen action', () => {
    const scene = createInitialGameScene();
    const gato = scene.creatures.find((creature) => creature.word.id === 'gato');
    const mesa = scene.creatures.find((creature) => creature.word.id === 'mesa');

    expect(gato).toBeDefined();
    expect(mesa).toBeDefined();
    if (gato === undefined || mesa === undefined) return;

    const wrongShot = createCreatureResolution(gato, 'shoot', 1);
    const correctShot = createCreatureResolution(mesa, 'shoot', 2);

    expect(wrongShot.translation).toBe('Katze');
    expect(wrongShot.matchesTarget).toBe(true);
    expect(wrongShot.isCorrect).toBe(false);
    expect(correctShot.translation).toBe('Tisch');
    expect(correctShot.matchesTarget).toBe(false);
    expect(correctShot.isCorrect).toBe(true);
  });
});
