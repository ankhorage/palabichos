import { describe, expect, test } from 'bun:test';

import { createGameScene } from './createGameScene';
import { createLetterProjectiles } from './createLetterProjectiles';

describe('createLetterProjectiles', () => {
  test('emits one readable projectile per German translation letter and preserves umlauts', () => {
    const scene = createGameScene(1);
    const creature = scene.creatures.find((candidate) => candidate.word.text === 'queso');

    expect(creature).toBeDefined();
    if (creature === undefined) return;

    const projectiles = createLetterProjectiles(creature, 4);

    expect(projectiles.map((projectile) => projectile.letter).join('')).toBe('Käse');
    expect(projectiles).toHaveLength(Array.from('Käse').length);
    expect(new Set(projectiles.map((projectile) => projectile.id)).size).toBe(projectiles.length);
  });
});
