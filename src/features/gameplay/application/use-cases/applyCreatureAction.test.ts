import { describe, expect, test } from 'bun:test';

import { applyCreatureAction } from './applyCreatureAction';
import { createInitialGameScene } from './createInitialGameScene';

describe('applyCreatureAction', () => {
  test('collects a matching creature, increments progress, and respawns', () => {
    const scene = createInitialGameScene();
    const result = applyCreatureAction(scene, 'creature-gato', 'collect');

    expect(result.outcome).toBe('collected');
    expect(result.scene.collectedCount).toBe(1);
    expect(result.scene.creatures).toHaveLength(scene.creatures.length);
    expect(result.scene.creatures.some((creature) => creature.id === 'creature-gato')).toBe(false);
    expect(result.scene.creatures.some((creature) => creature.word.text === 'conejo')).toBe(true);
  });

  test('destroys a distractor without increasing collection progress', () => {
    const scene = createInitialGameScene();
    const result = applyCreatureAction(scene, 'creature-mesa', 'shoot');

    expect(result.outcome).toBe('destroyed');
    expect(result.scene.collectedCount).toBe(0);
    expect(result.scene.creatures).toHaveLength(scene.creatures.length);
    expect(result.scene.creatures.some((creature) => creature.id === 'creature-mesa')).toBe(false);
  });

  test('keeps a creature available and loses health for a wrong action', () => {
    const scene = createInitialGameScene();
    const result = applyCreatureAction(scene, 'creature-gato', 'shoot');

    expect(result.outcome).toBe('mistake');
    expect(result.scene.health).toBe(4);
    expect(result.scene.spawnSequence).toBe(0);
    expect(result.scene.creatures.some((creature) => creature.id === 'creature-gato')).toBe(true);
  });

  test('cycles level-owned respawn content through matching and non-matching words', () => {
    const initial = createInitialGameScene();
    const afterCollect = applyCreatureAction(initial, 'creature-gato', 'collect').scene;
    const afterShot = applyCreatureAction(afterCollect, 'creature-mesa', 'shoot').scene;

    expect(afterShot.creatures.some((creature) => creature.word.text === 'conejo')).toBe(true);
    expect(afterShot.creatures.some((creature) => creature.word.text === 'silla')).toBe(true);
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
