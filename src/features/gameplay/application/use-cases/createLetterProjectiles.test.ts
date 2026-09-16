import { describe, expect, test } from 'bun:test';

import { createInitialGameScene } from './createInitialGameScene';
import { createLetterProjectiles } from './createLetterProjectiles';

describe('createLetterProjectiles', () => {
  test('emits one readable projectile per displayed letter and preserves accents', () => {
    const scene = createInitialGameScene();
    const creature = scene.creatures.find((candidate) => candidate.word.text === 'pájaro');

    expect(creature).toBeDefined();
    if (creature === undefined) return;

    const projectiles = createLetterProjectiles(creature, 4);

    expect(projectiles.map((projectile) => projectile.letter).join('')).toBe('pájaro');
    expect(projectiles).toHaveLength(Array.from('pájaro').length);
    expect(new Set(projectiles.map((projectile) => projectile.id)).size).toBe(projectiles.length);
  });
});
