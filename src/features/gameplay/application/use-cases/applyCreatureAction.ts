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
  const creature = scene.creatures.find((candidate) => candidate.id === creatureId);

  if (creature === undefined) {
    return {
      scene,
      outcome: 'ignored',
      creatureId,
    };
  }

  const isCorrect = action === 'collect' ? creature.matchesTarget : !creature.matchesTarget;

  if (!isCorrect) {
    return {
      scene: {
        ...scene,
        health: Math.max(0, scene.health - 1),
      },
      outcome: 'mistake',
      creatureId,
    };
  }

  const replacement = createReplacementCreature(scene);

  return {
    scene: {
      ...scene,
      collectedCount:
        action === 'collect'
          ? Math.min(scene.level.targetCount, scene.collectedCount + 1)
          : scene.collectedCount,
      creatures: scene.creatures.map((candidate) =>
        candidate.id === creatureId ? replacement : candidate,
      ),
      spawnSequence: scene.spawnSequence + 1,
    },
    outcome: action === 'collect' ? 'collected' : 'destroyed',
    creatureId,
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
