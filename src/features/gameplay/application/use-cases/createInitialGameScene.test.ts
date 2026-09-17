import { describe, expect, test } from 'bun:test';

import { getPlayableVocabularyCategories } from '../../../vocabulary/application/use-cases/getPlayableVocabularyCategories';
import { getVocabularyWordsForCategory } from '../../../vocabulary/application/use-cases/getVocabularyWordsForCategory';
import { VOCABULARY_CATEGORIES } from '../../../vocabulary/constants/categories';
import { VOCABULARY_WORDS } from '../../../vocabulary/constants/words';
import { createGameScene } from './createGameScene';
import { createInitialGameScene } from './createInitialGameScene';

describe('game scene catalog', () => {
  test('provides one hundred category definitions with a broad playable starter set', () => {
    const playable = getPlayableVocabularyCategories(20);

    expect(VOCABULARY_CATEGORIES).toHaveLength(100);
    expect(VOCABULARY_WORDS).toHaveLength(480);
    expect(playable.length).toBeGreaterThanOrEqual(16);
    expect(
      playable.every((category) => getVocabularyWordsForCategory(category.id).length >= 20),
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
    expect(first.playedCategoryIds).toEqual([first.level.targetCategoryId]);
    expect(last.playedCategoryIds).toEqual([last.level.targetCategoryId]);
    expect(first.phase).toBe('playing');
    expect(last.phase).toBe('playing');
  });

  test('starts with the configured balanced active answer mix', () => {
    const scene = createInitialGameScene(0);
    const targetCount = scene.creatures.filter((creature) => creature.matchesTarget).length;
    const distractorCount = scene.creatures.filter((creature) => !creature.matchesTarget).length;

    expect(scene.level.targetCount).toBe(20);
    expect(scene.collectedCount).toBe(0);
    expect(scene.correctStreak).toBe(0);
    expect(scene.health).toBe(5);
    expect(scene.gameplayConfig.maxHealth).toBe(7);
    expect(scene.creatures).toHaveLength(scene.gameplayConfig.initialCreatureCount);
    expect(targetCount).toBe(scene.gameplayConfig.activeTargetCount);
    expect(distractorCount).toBe(
      scene.gameplayConfig.initialCreatureCount - scene.gameplayConfig.activeTargetCount,
    );
  });

  test('starts distractors from different non-target vocabulary categories', () => {
    const scene = createGameScene('animals');
    const distractors = scene.creatures.filter((creature) => !creature.matchesTarget);
    const sourceCategories = distractors.map((creature) =>
      creature.word.categoryIds.find((categoryId) => categoryId !== scene.level.targetCategoryId),
    );

    expect(sourceCategories.every((categoryId) => categoryId !== undefined)).toBe(true);
    expect(new Set(sourceCategories).size).toBe(distractors.length);
  });

  test('mixes targets and distractors across both horizontal sides between rounds', () => {
    const seeds = [0, 0.25, 0.5, 0.75];
    const creatures = seeds.flatMap((seed) => createGameScene('animals', 0, seed).creatures);
    const targets = creatures.filter((creature) => creature.matchesTarget);
    const distractors = creatures.filter((creature) => !creature.matchesTarget);

    expect(targets.some((creature) => creature.xPercent < 50)).toBe(true);
    expect(targets.some((creature) => creature.xPercent > 50)).toBe(true);
    expect(distractors.some((creature) => creature.xPercent < 50)).toBe(true);
    expect(distractors.some((creature) => creature.xPercent > 50)).toBe(true);
  });
});
