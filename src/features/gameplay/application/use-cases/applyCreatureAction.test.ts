import { describe, expect, test } from 'bun:test';

import type { CreatureViewModel, GameScene } from '../../../../types/gameplay';
import { getDistractorCategoryId } from '../../utils/getDistractorCategoryId';
import { applyCreatureAction } from './applyCreatureAction';
import { createGameScene } from './createGameScene';

describe('applyCreatureAction correctness', () => {
  test('shoots a target, advances progress, records Vocab, and resolves only the clicked word', () => {
    const scene = createGameScene('animals', 0, 0.1);
    const creature = requireCreature(scene, true);
    const result = applyCreatureAction(scene, creature.id, 0.42);

    expect(result.outcome).toBe('destroyed');
    expect(result.scene.collectedCount).toBe(1);
    expect(result.scene.correctStreak).toBe(1);
    expect(result.scene.health).toBe(scene.health);
    expect(result.vocabWord?.id).toBe(creature.word.id);
    expect(result.scene.resolvedWordIds).toEqual([creature.word.id]);
  });

  test('shooting a distractor loses health, resets streak, and resolves no Vocab word', () => {
    const initial = createGameScene('animals', 0, 0.1);
    const scene = { ...initial, correctStreak: 4 };
    const creature = requireCreature(scene, false);
    const result = applyCreatureAction(scene, creature.id, 0.42);

    expect(result.scene.collectedCount).toBe(0);
    expect(result.scene.health).toBe(4);
    expect(result.scene.correctStreak).toBe(0);
    expect(result.vocabWord).toBeNull();
    expect(result.scene.resolvedWordIds).toEqual([creature.word.id]);
  });
});

describe('applyCreatureAction full board refresh', () => {
  test('replaces all six words after an action with exactly two targets and four distractors', () => {
    const scene = createGameScene('animals', 0, 0.1);
    const previousWordIds = scene.creatures.map((creature) => creature.word.id);
    const result = applyCreatureAction(scene, requireCreature(scene, true).id, 0.42);
    const nextWordIds = result.scene.creatures.map((creature) => creature.word.id);

    expect(result.scene.boardSequence).toBe(1);
    expect(nextWordIds.every((wordId) => !previousWordIds.includes(wordId))).toBe(true);
    expect(result.scene.creatures.filter((creature) => creature.matchesTarget)).toHaveLength(2);
    expect(result.scene.creatures.filter((creature) => !creature.matchesTarget)).toHaveLength(4);
  });

  test('redistributes board presentation from the previous field', () => {
    const scene = createGameScene('animals', 0, 0.1);
    const result = applyCreatureAction(scene, requireCreature(scene, true).id, 0.83);

    expect(createPositionSignature(result.scene)).not.toBe(createPositionSignature(scene));
    expect(result.scene.presentationSeed).toBe(0.83);
  });

  test('keeps distractor categories diverse after a refresh', () => {
    const scene = createGameScene('animals', 0, 0.1);
    const result = applyCreatureAction(scene, requireCreature(scene, true).id, 0.42);
    const categoryIds = getDistractorCategoryIds(result.scene);

    expect(categoryIds).toHaveLength(4);
    expect(new Set(categoryIds).size).toBe(categoryIds.length);
  });
});

describe('applyCreatureAction round semantics', () => {
  test('never repeats a resolved target during a correct-only round', () => {
    const completed = playCorrectly(createGameScene('animals', 0, 0.11));

    expect(completed.phase).toBe('level-complete');
    expect(completed.resolvedWordIds).toHaveLength(completed.level.targetCount);
    expect(new Set(completed.resolvedWordIds).size).toBe(completed.resolvedWordIds.length);
  });

  test('does not build an unnecessary next board when the action completes the level', () => {
    const initial = createGameScene('animals', 0, 0.1);
    const scene = { ...initial, collectedCount: initial.level.targetCount - 1 };
    const previousCreatureIds = scene.creatures.map((creature) => creature.id);
    const result = applyCreatureAction(scene, requireCreature(scene, true).id, 0.91);

    expect(result.scene.phase).toBe('level-complete');
    expect(result.scene.boardSequence).toBe(scene.boardSequence);
    expect(result.scene.creatures.map((creature) => creature.id)).toEqual(previousCreatureIds);
  });

  test('awards an extra life at the configured streak threshold', () => {
    const initial = createGameScene('animals');
    const scene = {
      ...initial,
      correctStreak: initial.gameplayConfig.correctActionsPerExtraLife - 1,
      health: 4,
    };
    const result = applyCreatureAction(scene, requireCreature(scene, true).id, 0.42);

    expect(result.scene.correctStreak).toBe(0);
    expect(result.scene.health).toBe(5);
  });
});

/*** Finish one round by shooting targets with deterministic fresh-board seeds. */
function playCorrectly(scene: GameScene): GameScene {
  if (scene.phase !== 'playing') return scene;
  const creature = requireCreature(scene, true);
  const seed = ((scene.boardSequence + 1) * 0.173) % 1;
  return playCorrectly(applyCreatureAction(scene, creature.id, seed).scene);
}

/*** Require one active creature with the requested answer class. */
function requireCreature(scene: GameScene, matchesTarget: boolean): CreatureViewModel {
  const creature = scene.creatures.find((candidate) => candidate.matchesTarget === matchesTarget);
  if (creature === undefined) throw new Error('Expected creature missing from test scene.');
  return creature;
}

/*** Return one stable string describing all active presentation positions. */
function createPositionSignature(scene: GameScene) {
  return scene.creatures.map((creature) => `${creature.xPercent}:${creature.yPercent}`).join('|');
}

/*** Return active distractor category ids for diversity assertions. */
function getDistractorCategoryIds(scene: GameScene): readonly string[] {
  return scene.creatures
    .filter((creature) => !creature.matchesTarget)
    .flatMap((creature) => {
      const categoryId = getDistractorCategoryId(creature.word, scene.level.targetCategoryId);
      return categoryId === null ? [] : [categoryId];
    });
}
