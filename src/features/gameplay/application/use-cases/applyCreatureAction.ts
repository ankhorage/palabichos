import type {
  CreatureActionResult,
  CreatureViewModel,
  GameScene,
} from '../../../../types/gameplay';
import type { VocabularyWord } from '../../../../types/vocabulary';
import { getDistractorCategoryId } from '../../utils/getDistractorCategoryId';
import { isSameCreatureRegion } from '../../utils/isSameCreatureRegion';
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
  const agedScene = isCorrect ? ageActiveDistractors(progressedScene) : progressedScene;
  const replacedScene = replaceCreature(agedScene, creature.id, creature.matchesTarget, creature);
  const retirement =
    isCorrect && replacedScene.phase === 'playing'
      ? retireEligibleDistractor(replacedScene)
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

/*** Increment the age of every distractor that survives one successful target shot. */
function ageActiveDistractors(scene: GameScene): GameScene {
  return {
    ...scene,
    creatures: scene.creatures.map((creature) =>
      creature.matchesTarget
        ? creature
        : { ...creature, ageInCorrectShots: creature.ageInCorrectShots + 1 },
    ),
  };
}

/*** Replace one active creature with an unused word of the same answer class. */
function replaceCreature(
  scene: GameScene,
  creatureId: string,
  matchesTarget: boolean,
  avoidPosition: { readonly xPercent: number; readonly yPercent: number } | null,
): GameScene {
  const replacementWord = selectReplacementWord(scene, matchesTarget, creatureId);
  const occupiedCreatures = scene.creatures.filter((creature) => creature.id !== creatureId);
  const replacement = createCreatureViewModel(
    replacementWord,
    scene.gameplayConfig.initialCreatureCount + scene.spawnSequence,
    scene.level.targetCategoryId,
    scene.presentationSeed,
    occupiedCreatures,
    scene.gameplayConfig.creatureMinimumDistancePercent,
    avoidPosition,
  );
  const recentDistractorCategoryIds = matchesTarget
    ? scene.recentDistractorCategoryIds
    : appendRecentDistractorCategory(scene, replacementWord);

  return {
    ...scene,
    creatures: scene.creatures.map((creature) =>
      creature.id === creatureId ? replacement : creature,
    ),
    remainingWords: scene.remainingWords.filter((word) => word.id !== replacementWord.id),
    usedWordIds: [...scene.usedWordIds, replacementWord.id],
    spawnSequence: scene.spawnSequence + 1,
    recentDistractorCategoryIds,
  };
}

interface DistractorRetirement {
  readonly scene: GameScene;
  readonly retiredCreature: CreatureViewModel | null;
}

/*** Retire one eligible distractor, replace it neutrally, and rotate distractor positions. */
function retireEligibleDistractor(scene: GameScene): DistractorRetirement {
  const retiredCreature = selectDistractorForRetirement(scene);
  if (retiredCreature === null) return { scene, retiredCreature: null };

  const replacedScene = replaceCreature(scene, retiredCreature.id, false, retiredCreature);
  return {
    scene: rotateDistractorPositions(replacedScene, retiredCreature),
    retiredCreature,
  };
}

/*** Rotate active distractor positions while moving the newest distractor to another region. */
function rotateDistractorPositions(
  scene: GameScene,
  retiredCreature: CreatureViewModel,
): GameScene {
  const distractors = scene.creatures.filter((creature) => !creature.matchesTarget);
  const replacement = distractors.reduce<CreatureViewModel | null>(
    (newest, creature) =>
      newest === null || creature.spawnSequence > newest.spawnSequence ? creature : newest,
    null,
  );
  if (replacement === null) return scene;

  const donor = distractors.find(
    (creature) =>
      creature.id !== replacement.id && !isSameCreatureRegion(creature, retiredCreature),
  );
  if (donor === undefined) return scene;

  const remaining = distractors.filter(
    (creature) => creature.id !== replacement.id && creature.id !== donor.id,
  );
  const ordered = [replacement, donor, ...remaining];
  const positions = ordered.map((creature) => ({
    xPercent: creature.xPercent,
    yPercent: creature.yPercent,
  }));

  return {
    ...scene,
    creatures: scene.creatures.map((creature) => {
      const index = ordered.findIndex((candidate) => candidate.id === creature.id);
      if (index < 0) return creature;
      const nextPosition = positions.at((index + 1) % positions.length);
      return nextPosition === undefined ? creature : { ...creature, ...nextPosition };
    }),
  };
}

/*** Select the oldest distractor whose age has reached its configured lifetime. */
function selectDistractorForRetirement(scene: GameScene): CreatureViewModel | null {
  const eligible = scene.creatures.filter(
    (creature) =>
      !creature.matchesTarget && creature.ageInCorrectShots >= createRetirementAge(scene, creature),
  );
  const forced = eligible.filter(
    (creature) =>
      creature.ageInCorrectShots >= scene.gameplayConfig.distractorRetireMaxAgeCorrectShots,
  );
  const candidates = forced.length > 0 ? forced : eligible;

  return candidates.reduce<CreatureViewModel | null>(
    (oldest, creature) =>
      oldest === null ||
      creature.ageInCorrectShots > oldest.ageInCorrectShots ||
      (creature.ageInCorrectShots === oldest.ageInCorrectShots &&
        creature.spawnSequence < oldest.spawnSequence)
        ? creature
        : oldest,
    null,
  );
}

/*** Derive one stable lifetime between configured min and max ages from round and spawn identity. */
function createRetirementAge(scene: GameScene, creature: CreatureViewModel) {
  const minimum = scene.gameplayConfig.distractorRetireMinAgeCorrectShots;
  const maximum = scene.gameplayConfig.distractorRetireMaxAgeCorrectShots;
  const range = maximum - minimum + 1;
  const seedOffset = Math.floor(Math.min(0.999999, Math.max(0, scene.presentationSeed)) * 1000);
  return minimum + ((creature.spawnSequence + seedOffset) % range);
}

/*** Select the next unused round word while preserving answer class and distractor freshness. */
function selectReplacementWord(
  scene: GameScene,
  matchesTarget: boolean,
  replacedCreatureId: string,
): VocabularyWord {
  const candidates = scene.remainingWords.filter(
    (candidate) => candidate.categoryIds.includes(scene.level.targetCategoryId) === matchesTarget,
  );
  const word = matchesTarget
    ? candidates.at(0)
    : selectFreshDistractorWord(scene, candidates, replacedCreatureId);

  if (word === undefined) {
    throw new Error(
      `Round ${scene.level.id} exhausted its ${matchesTarget ? 'target' : 'distractor'} pool.`,
    );
  }

  return word;
}

/*** Prefer a distractor category that is neither currently active nor recently represented. */
function selectFreshDistractorWord(
  scene: GameScene,
  candidates: readonly VocabularyWord[],
  replacedCreatureId: string,
) {
  const activeCategoryIds = scene.creatures
    .filter((creature) => !creature.matchesTarget && creature.id !== replacedCreatureId)
    .flatMap((creature) => {
      const categoryId = getDistractorCategoryId(creature.word, scene.level.targetCategoryId);
      return categoryId === null ? [] : [categoryId];
    });
  const isFresh = (word: VocabularyWord) => {
    const categoryId = getDistractorCategoryId(word, scene.level.targetCategoryId);
    return (
      categoryId !== null &&
      !activeCategoryIds.includes(categoryId) &&
      !scene.recentDistractorCategoryIds.includes(categoryId)
    );
  };
  const isNotActive = (word: VocabularyWord) => {
    const categoryId = getDistractorCategoryId(word, scene.level.targetCategoryId);
    return categoryId !== null && !activeCategoryIds.includes(categoryId);
  };
  const isNotRecent = (word: VocabularyWord) => {
    const categoryId = getDistractorCategoryId(word, scene.level.targetCategoryId);
    return categoryId !== null && !scene.recentDistractorCategoryIds.includes(categoryId);
  };

  return (
    candidates.find(isFresh) ??
    candidates.find(isNotActive) ??
    candidates.find(isNotRecent) ??
    candidates.at(0)
  );
}

/*** Append one replacement category to the bounded recent-distractor history. */
function appendRecentDistractorCategory(scene: GameScene, word: VocabularyWord) {
  const categoryId = getDistractorCategoryId(word, scene.level.targetCategoryId);
  if (categoryId === null) return scene.recentDistractorCategoryIds;

  return [...scene.recentDistractorCategoryIds, categoryId].slice(
    -scene.gameplayConfig.distractorRecentCategoryWindow,
  );
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
