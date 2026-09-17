import { describe, expect, test } from 'bun:test';

import { getPlayableVocabularyCategories } from '../../../vocabulary/application/use-cases/getPlayableVocabularyCategories';
import { VOCABULARY_CATEGORIES } from '../../../vocabulary/constants/categories';
import { VOCABULARY_WORDS } from '../../../vocabulary/constants/words';
import { createInitialGameScene } from './createInitialGameScene';

describe('game scene catalog', () => {
  test('provides one hundred category definitions with a broad playable starter set', () => {
    const playable = getPlayableVocabularyCategories(20);

    expect(VOCABULARY_CATEGORIES).toHaveLength(100);
    expect(VOCABULARY_WORDS).toHaveLength(480);
    expect(playable.length).toBeGreaterThanOrEqual(16);
    expect(
      playable.every(
        (category) =>
          VOCABULARY_WORDS.filter((word) => word.categoryIds.includes(category.id)).length >= 20,
      ),
    ).toBe(true);
  });

  test('preserves German translations in the reusable catalog', () => {
    expect(VOCABULARY_WORDS.find((word) => word.text === 'caballo')?.translation).toBe('Pferd');
    expect(VOCABULARY_WORDS.find((word) => word.text === 'manzana')?.translation).toBe('Apfel');
  });
});

describe('randomized initial scene', () => {
  test('selects different playable categories from deterministic random values', () => {
    const first = createInitialGameScene(0);
    const last = createInitialGameScene(0.999999);

    expect(first.level.targetCategoryId).not.toBe(last.level.targetCategoryId);
    expect(first.phase).toBe('playing');
    expect(last.phase).toBe('playing');
  });

  test('starts with configured health, progress, and a mixed creature set', () => {
    const scene = createInitialGameScene(0);

    expect(scene.level.targetCount).toBe(20);
    expect(scene.collectedCount).toBe(0);
    expect(scene.correctStreak).toBe(0);
    expect(scene.health).toBe(5);
    expect(scene.gameplayConfig.maxHealth).toBe(7);
    expect(scene.creatures).toHaveLength(scene.gameplayConfig.initialCreatureCount);
    expect(scene.creatures.some((creature) => creature.matchesTarget)).toBe(true);
    expect(scene.creatures.some((creature) => !creature.matchesTarget)).toBe(true);
  });
});
