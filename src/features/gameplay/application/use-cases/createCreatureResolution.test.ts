import { describe, expect, test } from 'bun:test';

import { createCreatureResolution } from './createCreatureResolution';
import { createInitialGameScene } from './createInitialGameScene';

describe('createCreatureResolution', () => {
  test('derives correctness from category membership and the selected action', () => {
    const scene = createInitialGameScene();
    const gato = scene.creatures.find((creature) => creature.word.id === 'gato');
    const mesa = scene.creatures.find((creature) => creature.word.id === 'mesa');

    expect(gato).toBeDefined();
    expect(mesa).toBeDefined();
    if (gato === undefined || mesa === undefined) return;

    const targetCollect = createCreatureResolution(gato, 'collect', 1);
    const targetShoot = createCreatureResolution(gato, 'shoot', 2);
    const distractorShoot = createCreatureResolution(mesa, 'shoot', 3);
    const distractorCollect = createCreatureResolution(mesa, 'collect', 4);

    expect(targetCollect.translation).toBe('Katze');
    expect(targetCollect.isCorrect).toBe(true);
    expect(targetShoot.isCorrect).toBe(false);
    expect(distractorShoot.translation).toBe('Tisch');
    expect(distractorShoot.isCorrect).toBe(true);
    expect(distractorCollect.isCorrect).toBe(false);
  });
});
