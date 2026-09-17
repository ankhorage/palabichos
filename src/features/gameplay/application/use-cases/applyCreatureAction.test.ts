import { describe, expect, test } from 'bun:test';

import type {
  CreatureActionResult,
  CreatureViewModel,
  GameScene,
} from '../../../../types/gameplay';
import { getDistractorCategoryId } from '../../utils/getDistractorCategoryId';
import { applyCreatureAction } from './applyCreatureAction';
import { createGameScene } from './createGameScene';

describe('applyCreatureAction correctness', () => {
  test('shoots a target, advances progress, and records it for Vocab', () => {
    const scene = createGameScene('animals');
    const creature = requireCreature(scene, true);
    const result = applyCreatureAction(scene, creature.id);

    expect(result.outcome).toBe('destroyed');
    expect(result.scene.collectedCount).toBe(1);
    expect(result.scene.correctStreak).toBe(1);
    expect(result.scene.health).toBe(scene.health);
    expect(result.vocabWord?.id).toBe(creature.word.id);
  });

  test('shooting a distractor loses health, resets streak, and does not capture Vocab', () => {
    const scene = { ...createGameScene('animals'), correctStreak: 4 };
    const creature = requireCreature(scene, false);
    const result = applyCreatureAction(scene, creature.id);

    expect(result.outcome).toBe('destroyed');
    expect(result.scene.collectedCount).toBe(0);
    expect(result.scene.health).toBe(4);
    expect(result.scene.correctStreak).toBe(0);
    expect(result.vocabWord).toBeNull();
  });
});

describe('applyCreatureAction active mix', () => {
  test('keeps the configured three-target three-distractor mix through correct-only play', () => {
    const scenes = playCorrectShots(createGameScene('animals'), 12);

    expect(
      scenes.every(
        (scene) =>
          scene.creatures.filter((creature) => creature.matchesTarget).length ===
          scene.gameplayConfig.activeTargetCount,
      ),
    ).toBe(true);
    expect(
      scenes.every(
        (scene) =>
          scene.creatures.filter((creature) => !creature.matchesTarget).length ===
          scene.gameplayConfig.initialCreatureCount - scene.gameplayConfig.activeTargetCount,
      ),
    ).toBe(true);
  });

  test('ages surviving distractors on every successful target shot', () => {
    const initial = createGameScene('animals', 0, 0.37);
    const target = requireCreature(initial, true);
    const result = applyCreatureAction(initial, target.id);
    const distractors = result.scene.creatures.filter((creature) => !creature.matchesTarget);

    expect(result.retiredCreature).toBeNull();
    expect(distractors.every((creature) => creature.ageInCorrectShots === 1)).toBe(true);
  });
});

describe('applyCreatureAction distractor churn', () => {
  test('rotates eligible distractors at varied ages before they become stale', () => {
    const initial = createGameScene('animals', 0, 0.37);
    const results = playCorrectShotResults(initial, 17);
    const retirements = results
      .map((result, index) => ({ creature: result.retiredCreature, shotNumber: index + 1 }))
      .filter((entry) => entry.creature !== null);
    const retirementGaps = retirements
      .slice(1)
      .map((entry, index) => entry.shotNumber - (retirements.at(index)?.shotNumber ?? 0));

    expect(retirements.length).toBeGreaterThan(5);
    expect(
      retirements.every(
        ({ creature }) =>
          creature !== null &&
          creature.ageInCorrectShots >= initial.gameplayConfig.distractorRetireMinAgeCorrectShots &&
          creature.ageInCorrectShots <= initial.gameplayConfig.distractorRetireMaxAgeCorrectShots,
      ),
    ).toBe(true);
    expect(new Set(retirementGaps).size).toBeGreaterThan(1);
    expect(results.every((result) => hasNoStaleDistractors(result.scene))).toBe(true);
  });

  test('keeps active distractor categories diverse through churn', () => {
    const results = playCorrectShotResults(createGameScene('animals', 0, 0.37), 12);

    expect(results.every((result) => hasDistinctDistractorCategories(result.scene))).toBe(true);
  });
});

describe('applyCreatureAction churn placement', () => {
  test('moves churn replacements away from the retired presentation region when possible', () => {
    const result = playCorrectShotResults(createGameScene('animals', 0, 0.37), 6).find(
      (candidate) => candidate.retiredCreature !== null,
    );

    expect(result).toBeDefined();
    if (result?.retiredCreature === null || result === undefined) return;
    const newestDistractor = result.scene.creatures
      .filter((creature) => !creature.matchesTarget)
      .reduce((newest, creature) =>
        creature.spawnSequence > newest.spawnSequence ? creature : newest,
      );

    expect(createRegionKey(newestDistractor)).not.toBe(createRegionKey(result.retiredCreature));
  });

  test('keeps active creature positions at the configured minimum distance', () => {
    const scenes = playCorrectShots(createGameScene('animals', 0, 0.75), 12);

    expect(scenes.every(hasReadableCreatureSpacing)).toBe(true);
  });
});

describe('applyCreatureAction round progression', () => {
  test('completes a round by shooting targets without reusing any word id', () => {
    const completed = playCorrectly(createGameScene('animals'));

    expect(completed.phase).toBe('level-complete');
    expect(completed.collectedCount).toBe(completed.level.targetCount);
    expect(new Set(completed.usedWordIds).size).toBe(completed.usedWordIds.length);
  });

  test('awards an extra life at the configured streak threshold', () => {
    const initial = createGameScene('animals');
    const scene = {
      ...initial,
      correctStreak: initial.gameplayConfig.correctActionsPerExtraLife - 1,
      health: 4,
    };
    const creature = requireCreature(scene, true);
    const result = applyCreatureAction(scene, creature.id);

    expect(result.scene.correctStreak).toBe(0);
    expect(result.scene.health).toBe(5);
  });
});

/*** Return sequential scenes produced by correct target shots for invariant assertions. */
function playCorrectShots(scene: GameScene, shotCount: number): readonly GameScene[] {
  return playCorrectShotResults(scene, shotCount).map((result) => result.scene);
}

/*** Return sequential action results produced by correct target shots. */
function playCorrectShotResults(
  scene: GameScene,
  shotCount: number,
): readonly CreatureActionResult[] {
  return Array.from({ length: shotCount }).reduce<readonly CreatureActionResult[]>((results) => {
    const current = results.at(-1)?.scene ?? scene;
    if (current.phase !== 'playing') return results;
    const creature = requireCreature(current, true);
    return [...results, applyCreatureAction(current, creature.id)];
  }, []);
}

/*** Return whether no active distractor exceeds the configured maximum churn age. */
function hasNoStaleDistractors(scene: GameScene) {
  return scene.creatures
    .filter((creature) => !creature.matchesTarget)
    .every(
      (creature) =>
        creature.ageInCorrectShots <= scene.gameplayConfig.distractorRetireMaxAgeCorrectShots,
    );
}

/*** Return whether every active creature pair keeps the configured minimum presentation distance. */
function hasReadableCreatureSpacing(scene: GameScene) {
  return scene.creatures.every((creature, index) =>
    scene.creatures
      .slice(index + 1)
      .every(
        (other) =>
          Math.hypot(creature.xPercent - other.xPercent, creature.yPercent - other.yPercent) >=
          scene.gameplayConfig.creatureMinimumDistancePercent,
      ),
  );
}

/*** Return whether all active distractors currently represent different source categories. */
function hasDistinctDistractorCategories(scene: GameScene) {
  const categoryIds = scene.creatures
    .filter((creature) => !creature.matchesTarget)
    .flatMap((creature) => {
      const categoryId = getDistractorCategoryId(creature.word, scene.level.targetCategoryId);
      return categoryId === null ? [] : [categoryId];
    });
  return new Set(categoryIds).size === categoryIds.length;
}

/*** Build one broad presentation-region key for movement assertions. */
function createRegionKey(position: { readonly xPercent: number; readonly yPercent: number }) {
  return `${position.xPercent < 50 ? 'left' : 'right'}-${position.yPercent < 45 ? 'top' : 'bottom'}`;
}

/*** Finish one round by repeatedly shooting the first active target. */
function playCorrectly(scene: GameScene): GameScene {
  if (scene.phase !== 'playing') return scene;
  const creature = requireCreature(scene, true);
  return playCorrectly(applyCreatureAction(scene, creature.id).scene);
}

/*** Require one active creature with the requested answer class. */
function requireCreature(scene: GameScene, matchesTarget: boolean): CreatureViewModel {
  const creature = scene.creatures.find((candidate) => candidate.matchesTarget === matchesTarget);
  if (creature === undefined) throw new Error('Expected creature missing from test scene.');
  return creature;
}
