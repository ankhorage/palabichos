import type { CreatureActionResult, GameScene } from '../../../../types/gameplay';
import { createGameBoard } from './createGameBoard';

/*** Apply one creature shot and rebuild the full answer board when play continues. */
export function applyCreatureAction(
  scene: GameScene,
  creatureId: string,
  randomValue: number,
): CreatureActionResult {
  if (scene.phase !== 'playing') return ignoredResult(scene, creatureId);

  const creature = scene.creatures.find((candidate) => candidate.id === creatureId);
  if (creature === undefined) return ignoredResult(scene, creatureId);

  const isCorrect = creature.matchesTarget;
  const progression = isCorrect ? correctProgression(scene) : mistakeProgression(scene);
  const collectedCount = isCorrect
    ? Math.min(scene.level.targetCount, scene.collectedCount + 1)
    : scene.collectedCount;
  const phase: GameScene['phase'] =
    progression.health === 0
      ? 'game-over'
      : collectedCount >= scene.level.targetCount
        ? 'level-complete'
        : 'playing';
  const resolvedWordIds = [...scene.resolvedWordIds, creature.word.id];
  const progressedScene: GameScene = {
    ...scene,
    ...progression,
    collectedCount,
    phase,
    resolvedWordIds,
  };
  const nextScene =
    phase === 'playing' ? refreshBoard(progressedScene, randomValue) : progressedScene;

  return {
    scene: nextScene,
    outcome: 'destroyed',
    creatureId,
    vocabWord: isCorrect ? creature.word : null,
  };
}

/*** Keep a non-actionable scene unchanged. */
function ignoredResult(scene: GameScene, creatureId: string): CreatureActionResult {
  return { scene, outcome: 'ignored', creatureId, vocabWord: null };
}

/*** Replace every active creature with one new randomized two-target answer board. */
function refreshBoard(scene: GameScene, randomValue: number): GameScene {
  const boardSequence = scene.boardSequence + 1;
  const previousWordIds = scene.creatures.map((creature) => creature.word.id);
  const creatures = createGameBoard({
    targetCategoryId: scene.level.targetCategoryId,
    config: scene.gameplayConfig,
    presentationSeed: randomValue,
    boardSequence,
    resolvedWordIds: scene.resolvedWordIds,
    previousWordIds,
  });

  return {
    ...scene,
    creatures,
    boardSequence,
    presentationSeed: randomValue,
  };
}

/*** Increment the perfect-action streak and award a configured extra life at its threshold. */
function correctProgression(scene: GameScene) {
  const nextStreak = scene.correctStreak + 1;
  const earnsExtraLife = nextStreak >= scene.gameplayConfig.correctActionsPerExtraLife;

  return {
    correctStreak: earnsExtraLife ? 0 : nextStreak,
    health: earnsExtraLife
      ? Math.min(scene.gameplayConfig.maxHealth, scene.health + 1)
      : scene.health,
  };
}

/*** Apply configured wrong-action damage and reset the perfect-action streak. */
function mistakeProgression(scene: GameScene) {
  return {
    correctStreak: 0,
    health: Math.max(0, scene.health - scene.gameplayConfig.wrongActionDamage),
  };
}
