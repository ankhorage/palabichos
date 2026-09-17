import { describe, expect, test } from 'bun:test';

import { getVocabularyWordsForCategory } from '../../../vocabulary/application/use-cases/getVocabularyWordsForCategory';
import { createCreatureViewModel } from './createCreatureViewModel';
import { createGameScene } from './createGameScene';
import { createLetterProjectiles } from './createLetterProjectiles';

describe('createLetterProjectiles', () => {
  test('emits configured readable projectiles and preserves German umlauts', () => {
    const scene = createGameScene('food');
    const word = getVocabularyWordsForCategory('food').find(
      (candidate) => candidate.text === 'queso',
    );

    expect(word).toBeDefined();
    if (word === undefined) return;

    const creature = createCreatureViewModel(word, 99, scene.level.targetCategoryId);
    const projectiles = createLetterProjectiles(creature, 4, scene.gameplayConfig);
    const [firstProjectile] = projectiles;

    expect(projectiles.map((projectile) => projectile.letter).join('')).toBe('Käse');
    expect(firstProjectile?.driftPercent).toBe(-scene.gameplayConfig.projectileFarDriftPercent);
    expect(firstProjectile?.fallDistancePercent).toBe(
      scene.gameplayConfig.projectileFallDistancePercent,
    );
  });
});
