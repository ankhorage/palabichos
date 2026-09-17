import { describe, expect, test } from 'bun:test';

import type { CreatureViewModel, GameScene } from '../../../../types/gameplay';
import { applyCreatureAction } from './applyCreatureAction';
import { createGameScene } from './createGameScene';

describe('applyCreatureAction correctness', () => {
  test('collects a target and records it for Vocab', () => {
    const scene = createGameScene('animals');
    const creature = requireCreature(scene, true);
    const result = applyCreatureAction(scene, creature.id, 'collect');

    expect(result.outcome).toBe('collected');
    expect(result.scene.collectedCount).toBe(1);
    expect(result.scene.correctStreak).toBe(1);
    expect(result.vocabWord?.id).toBe(creature.word.id);
  });

  test('shoots a distractor and records it for Vocab', () => {
    const scene = createGameScene('animals');
    const creature = requireCreature(scene, false);
    const result = applyCreatureAction(scene, creature.id, 'shoot');

    expect(result.outcome).toBe('destroyed');
    expect(result.scene.collectedCount).toBe(0);
    expect(result.scene.correctStreak).toBe(1);
    expect(result.vocabWord?.id).toBe(creature.word.id);
  });

  test('wrong actions lose health, reset streak, and do not capture Vocab', () => {
    const targetScene = { ...createGameScene('animals'), correctStreak: 4 };
    const target = requireCreature(targetScene, true);
    const targetResult = applyCreatureAction(targetScene, target.id, 'shoot');
    const distractorScene = { ...createGameScene('animals'), correctStreak: 4 };
    const distractor = requireCreature(distractorScene, false);
    const distractorResult = applyCreatureAction(distractorScene, distractor.id, 'collect');

    expect(targetResult.scene.health).toBe(4);
    expect(targetResult.scene.correctStreak).toBe(0);
    expect(targetResult.vocabWord).toBeNull();
    expect(distractorResult.scene.health).toBe(4);
    expect(distractorResult.vocabWord).toBeNull();
  });
});

describe('applyCreatureAction round progression', () => {
  test('completes a round without reusing any word id', () => {
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
    const result = applyCreatureAction(scene, creature.id, 'collect');

    expect(result.scene.correctStreak).toBe(0);
    expect(result.scene.health).toBe(5);
  });
});

function playCorrectly(scene: GameScene): GameScene {
  if (scene.phase !== 'playing') return scene;
  const [creature] = scene.creatures;
  if (creature === undefined) throw new Error('Expected active creature during test round.');
  const action = creature.matchesTarget ? 'collect' : 'shoot';
  return playCorrectly(applyCreatureAction(scene, creature.id, action).scene);
}

function requireCreature(scene: GameScene, matchesTarget: boolean): CreatureViewModel {
  const creature = scene.creatures.find((candidate) => candidate.matchesTarget === matchesTarget);
  if (creature === undefined) throw new Error('Expected creature missing from test scene.');
  return creature;
}
