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

function playCorrectly(scene: GameScene): GameScene {
  if (scene.phase !== 'playing') return scene;
  const creature = scene.creatures.find((candidate) => candidate.matchesTarget);
  if (creature === undefined) throw new Error('Expected target creature during test round.');
  return playCorrectly(applyCreatureAction(scene, creature.id).scene);
}

function requireCreature(scene: GameScene, matchesTarget: boolean): CreatureViewModel {
  const creature = scene.creatures.find((candidate) => candidate.matchesTarget === matchesTarget);
  if (creature === undefined) throw new Error('Expected creature missing from test scene.');
  return creature;
}
