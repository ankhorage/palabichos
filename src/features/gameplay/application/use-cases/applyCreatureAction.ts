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
  if (!isCorrect) return mistakeResult(scene, creature, action);

  return correctResult(scene, creature, action);
}

/*** Keep a non-actionable scene unchanged. */
function ignoredResult(scene: GameScene, creatureId: string): CreatureActionResult {
  return { scene, outcome: 'ignored', creatureId };
}

/*** Penalize one wrong decision while still physically destroying a wrongly shot word. */
function mistakeResult(
  scene: GameScene,
  creature: CreatureViewModel,
  action: CreatureAction,
): CreatureActionResult {
  const health = Math.max(0, scene.health - scene.gameplayConfig.wrongActionDamage);
  const shotReplacement = action === 'shoot' ? createReplacementCreature(scene) : null;

  return {
    scene: {
      ...scene,
      correctStreak: 0,
      health,
      phase: health === 0 ? 'game-over' : scene.phase,
      creatures:
        shotReplacement === null
          ? scene.creatures
          : scene.creatures.map((candidate) =>
              candidate.id === creature.id ? shotReplacement : candidate,
            ),
      spawnSequence: scene.spawnSequence + (shotReplacement === null ? 0 : 1),
    },
    outcome: 'mistake',
    creatureId: creature.id,
  };
}

/*** Apply one correct word decision, its streak reward, progress, and replacement. */
function correctResult(
  scene: GameScene,
  creature: CreatureViewModel,
  action: CreatureAction,
): CreatureActionResult {
  const collectedCount = nextCollectedCount(scene, action);
  const phase = collectedCount >= scene.level.targetCount ? 'level-complete' : scene.phase;
  const reward = correctActionReward(scene);
  const replacement = createReplacementCreature(scene);

  return {
    scene: {
      ...scene,
      collectedCount,
      correctStreak: reward.correctStreak,
      health: reward.health,
      phase,
      creatures: scene.creatures.map((candidate) =>
        candidate.id === creature.id ? replacement : candidate,
      ),
      spawnSequence: scene.spawnSequence + 1,
    },
    outcome: action === 'collect' ? 'collected' : 'destroyed',
    creatureId: creature.id,
  };
}

/*** Increment collection progress only for a correct collect action. */
function nextCollectedCount(scene: GameScene, action: CreatureAction) {
  if (action !== 'collect') return scene.collectedCount;
  return Math.min(scene.level.targetCount, scene.collectedCount + 1);
}

/*** Advance the correct-action streak and award a configured extra life at its threshold. */
function correctActionReward(scene: GameScene) {
  const correctStreak = scene.correctStreak + 1;
  const awardsExtraLife = correctStreak >= scene.gameplayConfig.correctActionsPerExtraLife;

  if (!awardsExtraLife) return { correctStreak, health: scene.health };

  return {
    correctStreak: 0,
    health: Math.min(scene.gameplayConfig.maxHealth, scene.health + 1),
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
