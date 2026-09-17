import type {
  CreatureAction,
  CreatureActionResult,
  GameplayConfig,
  GameScene,
} from '../../../../types/gameplay';
import type { VocabularyWord } from '../../../../types/vocabulary';
import { createCreatureViewModel } from './createCreatureViewModel';

/*** Apply one collect-or-shoot decision and return the next immutable gameplay scene. */
export function applyCreatureAction(
  scene: GameScene,
  creatureId: string,
  action: CreatureAction,
): CreatureActionResult {
  if (scene.phase !== 'playing') return ignoredResult(scene, creatureId);

  const creature = scene.creatures.find((candidate) => candidate.id === creatureId);
  if (creature === undefined) return ignoredResult(scene, creatureId);

  const isCorrect = action === 'collect' ? creature.matchesTarget : !creature.matchesTarget;
  const progression = isCorrect ? correctProgression(scene) : mistakeProgression(scene);
  const collectedCount =
    action === 'collect' && isCorrect
      ? Math.min(scene.level.targetCount, scene.collectedCount + 1)
      : scene.collectedCount;
  const phase =
    progression.health === 0
      ? 'game-over'
      : collectedCount >= scene.level.targetCount
        ? 'level-complete'
        : scene.phase;
  const replacementWord = selectReplacementWord(scene);
  const replacement = createCreatureViewModel(
    replacementWord,
    scene.gameplayConfig.initialCreatureCount + scene.spawnSequence,
    scene.level.targetCategoryId,
  );

  return {
    scene: {
      ...scene,
      ...progression,
      collectedCount,
      phase,
      creatures: scene.creatures.map((candidate) =>
        candidate.id === creature.id ? replacement : candidate,
      ),
      remainingWords: scene.remainingWords.filter((word) => word.id !== replacementWord.id),
      usedWordIds: [...scene.usedWordIds, replacementWord.id],
      spawnSequence: scene.spawnSequence + 1,
    },
    outcome: action === 'shoot' ? 'destroyed' : 'collected',
    creatureId,
    vocabWord: isCorrect ? creature.word : null,
  };
}

/*** Keep a non-actionable scene unchanged. */
function ignoredResult(scene: GameScene, creatureId: string): CreatureActionResult {
  return { scene, outcome: 'ignored', creatureId, vocabWord: null };
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

/*** Select the next unused round word while preserving the configured target ratio. */
function selectReplacementWord(scene: GameScene): VocabularyWord {
  const targetWords = scene.remainingWords.filter((word) =>
    word.categoryIds.includes(scene.level.targetCategoryId),
  );
  const distractorWords = scene.remainingWords.filter(
    (word) => !word.categoryIds.includes(scene.level.targetCategoryId),
  );
  const targetPreferred = prefersTarget(scene.spawnSequence, scene.gameplayConfig);
  const word = targetPreferred
    ? (targetWords[0] ?? distractorWords[0])
    : (distractorWords[0] ?? targetWords[0]);

  if (word === undefined) {
    throw new Error(`Round ${scene.level.id} exhausted its vocabulary pool.`);
  }

  return word;
}

/*** Return whether one replacement slot should favor a target word. */
function prefersTarget(sequence: number, config: GameplayConfig) {
  return sequence % config.spawnCycleLength < config.targetSpawnsPerCycle;
}
