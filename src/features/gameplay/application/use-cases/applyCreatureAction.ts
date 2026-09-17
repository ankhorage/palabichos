import type {
  CreatureActionResult,
  CreatureViewModel,
  GameScene,
} from '../../../../types/gameplay';
import type { VocabularyWord } from '../../../../types/vocabulary';
import { createCreatureViewModel } from './createCreatureViewModel';

/*** Apply one creature shot and return the next immutable gameplay scene. */
export function applyCreatureAction(scene: GameScene, creatureId: string): CreatureActionResult {
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
        : scene.phase;
  const progressedScene: GameScene = {
    ...scene,
    ...progression,
    collectedCount,
    phase,
  };
  const replacedScene = replaceCreature(progressedScene, creature.id, creature.matchesTarget);
  const retirement = shouldRetireDistractor(replacedScene, isCorrect)
    ? retireOldestDistractor(replacedScene)
    : { scene: replacedScene, retiredCreature: null };

  return {
    scene: retirement.scene,
    outcome: 'destroyed',
    creatureId,
    retiredCreature: retirement.retiredCreature,
    vocabWord: isCorrect ? creature.word : null,
  };
}

/*** Keep a non-actionable scene unchanged. */
function ignoredResult(scene: GameScene, creatureId: string): CreatureActionResult {
  return {
    scene,
    outcome: 'ignored',
    creatureId,
    retiredCreature: null,
    vocabWord: null,
  };
}

/*** Replace one active creature with an unused word of the same answer class. */
function replaceCreature(scene: GameScene, creatureId: string, matchesTarget: boolean): GameScene {
  const replacementWord = selectReplacementWord(scene, matchesTarget);
  const occupiedCreatures = scene.creatures.filter((creature) => creature.id !== creatureId);
  const replacement = createCreatureViewModel(
    replacementWord,
    scene.gameplayConfig.initialCreatureCount + scene.spawnSequence,
    scene.level.targetCategoryId,
    scene.presentationSeed,
    occupiedCreatures,
    scene.gameplayConfig.creatureMinimumDistancePercent,
  );

  return {
    ...scene,
    creatures: scene.creatures.map((creature) =>
      creature.id === creatureId ? replacement : creature,
    ),
    remainingWords: scene.remainingWords.filter((word) => word.id !== replacementWord.id),
    usedWordIds: [...scene.usedWordIds, replacementWord.id],
    spawnSequence: scene.spawnSequence + 1,
  };
}

/*** Return whether this successful shot reaches the configured neutral distractor-rotation cadence. */
function shouldRetireDistractor(scene: GameScene, isCorrect: boolean) {
  return (
    isCorrect &&
    scene.phase === 'playing' &&
    scene.collectedCount > 0 &&
    scene.collectedCount % scene.gameplayConfig.distractorRetireEveryCorrectShots === 0
  );
}

interface DistractorRetirement {
  readonly scene: GameScene;
  readonly retiredCreature: CreatureViewModel | null;
}

/*** Retire the oldest active distractor and replace it neutrally with a fresh distractor. */
function retireOldestDistractor(scene: GameScene): DistractorRetirement {
  const distractors = scene.creatures.filter((creature) => !creature.matchesTarget);
  const retiredCreature = distractors.reduce<CreatureViewModel | null>(
    (oldest, creature) =>
      oldest === null || creature.spawnSequence < oldest.spawnSequence ? creature : oldest,
    null,
  );

  if (retiredCreature === null) return { scene, retiredCreature: null };

  return {
    scene: replaceCreature(scene, retiredCreature.id, false),
    retiredCreature,
  };
}

/*** Select the next unused round word from the required answer class. */
function selectReplacementWord(scene: GameScene, matchesTarget: boolean): VocabularyWord {
  const word = scene.remainingWords.find(
    (candidate) => candidate.categoryIds.includes(scene.level.targetCategoryId) === matchesTarget,
  );

  if (word === undefined) {
    throw new Error(
      `Round ${scene.level.id} exhausted its ${matchesTarget ? 'target' : 'distractor'} pool.`,
    );
  }

  return word;
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
