import { describe, expect, test } from 'bun:test';

import type { CreatureViewModel, GameScene } from '../../../../types/gameplay';
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

describe('applyCreatureAction active field', () => {
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

  test('retires the oldest distractor neutrally every four correct target shots', () => {
    const initial = createGameScene('animals');
    const oldestDistractor = initial.creatures
      .filter((creature) => !creature.matchesTarget)
      .reduce((oldest, creature) =>
        creature.spawnSequence < oldest.spawnSequence ? creature : oldest,
      );
    const firstThree = shootTargets(initial, 3);
    const fourthTarget = requireCreature(firstThree, true);
    const result = applyCreatureAction(firstThree, fourthTarget.id);

    expect(result.retiredCreature?.id).toBe(oldestDistractor.id);
    expect(result.scene.health).toBe(initial.health);
    expect(result.scene.collectedCount).toBe(4);
    expect(result.vocabWord?.id).toBe(fourthTarget.word.id);
    expect(result.scene.usedWordIds).toContain(oldestDistractor.word.id);
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
  return Array.from({ length: shotCount }).reduce<readonly GameScene[]>((scenes) => {
    const current = scenes.at(-1) ?? scene;
    if (current.phase !== 'playing') return scenes;
    const creature = requireCreature(current, true);
    return [...scenes, applyCreatureAction(current, creature.id).scene];
  }, []);
}

/*** Apply a fixed number of correct target shots and return the resulting scene. */
function shootTargets(scene: GameScene, shotCount: number): GameScene {
  return Array.from({ length: shotCount }).reduce<GameScene>((current) => {
    const creature = requireCreature(current, true);
    return applyCreatureAction(current, creature.id).scene;
  }, scene);
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
