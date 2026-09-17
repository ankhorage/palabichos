import { describe, expect, test } from 'bun:test';

import { applyCreatureAction } from './applyCreatureAction';
import { createInitialGameScene } from './createInitialGameScene';

describe('applyCreatureAction action outcomes', () => {
  test('collects a matching creature, increments progress and streak, and respawns', () => {
    const scene = createInitialGameScene();
    const result = applyCreatureAction(scene, 'creature-gato', 'collect');

    expect(result.outcome).toBe('collected');
    expect(result.scene.collectedCount).toBe(1);
    expect(result.scene.correctStreak).toBe(1);
    expect(result.scene.creatures).toHaveLength(scene.creatures.length);
    expect(result.scene.creatures.some((creature) => creature.id === 'creature-gato')).toBe(false);
  });

  test('shoots a distractor, increments streak, and does not increase collection progress', () => {
    const scene = createInitialGameScene();
    const result = applyCreatureAction(scene, 'creature-mesa', 'shoot');

    expect(result.outcome).toBe('destroyed');
    expect(result.scene.collectedCount).toBe(0);
    expect(result.scene.correctStreak).toBe(1);
    expect(result.scene.creatures.some((creature) => creature.id === 'creature-mesa')).toBe(false);
  });

  test('wrongly shoots a target, loses health, resets streak, and still consumes the word', () => {
    const scene = { ...createInitialGameScene(), correctStreak: 4 };
    const result = applyCreatureAction(scene, 'creature-gato', 'shoot');

    expect(result.outcome).toBe('destroyed');
    expect(result.scene.health).toBe(4);
    expect(result.scene.correctStreak).toBe(0);
    expect(result.scene.spawnSequence).toBe(1);
    expect(result.scene.creatures.some((creature) => creature.id === 'creature-gato')).toBe(false);
  });

  test('wrongly collects a distractor, loses health, resets streak, and consumes the word', () => {
    const scene = { ...createInitialGameScene(), correctStreak: 4 };
    const result = applyCreatureAction(scene, 'creature-mesa', 'collect');

    expect(result.outcome).toBe('collected');
    expect(result.scene.health).toBe(4);
    expect(result.scene.correctStreak).toBe(0);
    expect(result.scene.spawnSequence).toBe(1);
    expect(result.scene.creatures.some((creature) => creature.id === 'creature-mesa')).toBe(false);
  });
});

describe('applyCreatureAction progression', () => {
  test('awards one extra life at the configured correct-action threshold and resets streak', () => {
    const initial = createInitialGameScene();
    const scene = {
      ...initial,
      correctStreak: initial.gameplayConfig.correctActionsPerExtraLife - 1,
      health: 4,
    };
    const result = applyCreatureAction(scene, 'creature-gato', 'collect');

    expect(result.scene.correctStreak).toBe(0);
    expect(result.scene.health).toBe(5);
  });

  test('never awards health above the configured maximum', () => {
    const initial = createInitialGameScene();
    const scene = {
      ...initial,
      correctStreak: initial.gameplayConfig.correctActionsPerExtraLife - 1,
      health: initial.gameplayConfig.maxHealth,
    };
    const result = applyCreatureAction(scene, 'creature-gato', 'collect');

    expect(result.scene.correctStreak).toBe(0);
    expect(result.scene.health).toBe(initial.gameplayConfig.maxHealth);
  });

  test('completes the level on the twentieth matching collect', () => {
    const scene = { ...createInitialGameScene(), collectedCount: 19 };
    const result = applyCreatureAction(scene, 'creature-gato', 'collect');

    expect(result.scene.collectedCount).toBe(20);
    expect(result.scene.phase).toBe('level-complete');
  });

  test('enters game over when a wrong action consumes the last health', () => {
    const scene = { ...createInitialGameScene(), health: 1 };
    const result = applyCreatureAction(scene, 'creature-gato', 'shoot');

    expect(result.scene.health).toBe(0);
    expect(result.scene.phase).toBe('game-over');
  });
});
