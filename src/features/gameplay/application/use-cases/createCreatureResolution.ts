import type {
  CreatureAction,
  CreatureResolution,
  CreatureViewModel,
} from '../../../../types/gameplay';

/*** Build the semantic feedback shown before one creature action is committed. */
export function createCreatureResolution(
  creature: CreatureViewModel,
  action: CreatureAction,
  id: number,
): CreatureResolution {
  return {
    id,
    creatureId: creature.id,
    action,
    translation: creature.word.translation,
    matchesTarget: creature.matchesTarget,
    isCorrect: action === 'collect' ? creature.matchesTarget : !creature.matchesTarget,
  };
}
