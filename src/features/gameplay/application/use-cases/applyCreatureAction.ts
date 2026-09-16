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
  if (!isCorrect) return mistakeResult(scene, creatureId);

  return correctResult(scene, creature, action);
}

/*** Keep a non-actionable scene unchanged. */
function ignoredResult(scene: GameScene, creatureId: string): CreatureActionResult {
  return { scene, outcome: 'ignored', creatureId };
}

/*** Apply one incorrect word decision and enter game over when health reaches zero. */
function mistakeResult(scene: GameScene, creatureId: string): CreatureActionResult {
  const health = Math.max(0, scene.health - 1);

  return {
    scene: {
      ...scene,
      health,
      phase: health === 0 ? 'game-over' : scene.phase,
    },
    outcome: 'mistake',
    creatureId,
  };
}

/*** Apply one correct word decision, progress collection, and complete the level at its target. */
function correctResult(
  scene: GameScene,
  creature: CreatureViewModel,
  action: CreatureAction,
): CreatureActionResult {
  const collectedCount =
    action === 'collect'
      ? Math.min(scene.level.targetCount, scene.collectedCount + 1)
      : scene.collectedCount;
  const phase = collectedCount >= scene.level.targetCount ? 'level-complete' : scene.phase;
  const replacement = createReplacementCreature(scene);

  return {
    scene: {
      ...scene,
      collectedCount,
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
