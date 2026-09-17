import type {
  CreatureAction,
  CreatureActionResult,
  CreatureViewModel,
  GameScene,
} from '../../../../types/gameplay';

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
  const replacement = createReplacementCreature(scene);

  return {
    scene: {
      ...scene,
      ...progression,
      collectedCount,
      phase,
      creatures: scene.creatures.map((candidate) =>
        candidate.id === creature.id ? replacement : candidate,
      ),
      spawnSequence: scene.spawnSequence + 1,
    },
    outcome: action === 'shoot' ? 'destroyed' : 'collected',
    creatureId,
  };
}

/*** Keep a non-actionable scene unchanged. */
function ignoredResult(scene: GameScene, creatureId: string): CreatureActionResult {
  return { scene, outcome: 'ignored', creatureId };
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

/*** Build the next deterministic creature from the level-owned respawn pool. */
function createReplacementCreature(scene: GameScene): CreatureViewModel {
  const pool = scene.level.respawnCreatures;
  const seed = pool[scene.spawnSequence % pool.length];

  if (seed === undefined) {
    throw new Error(`Level ${scene.level.id} requires at least one respawn creature.`);
  }

  return {
    ...seed,
    id: `${seed.id}-${scene.spawnSequence}`,
    matchesTarget: seed.word.categories.includes(scene.level.targetCategory),
  };
}
