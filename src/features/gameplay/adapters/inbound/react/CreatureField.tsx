import type {
  CreatureAction,
  CreatureResolution,
  CreatureViewModel,
} from '../../../../../types/gameplay';
import { WordCreature } from './WordCreature';

/*** Render the current creature collection with one shared interaction lock. */
export function CreatureField({
  creatures,
  disabled,
  mistakeCreatureId,
  onCreatureAction,
  resolution,
}: CreatureFieldProps) {
  return creatures.map((creature) => (
    <WordCreature
      key={creature.id}
      creature={creature}
      disabled={disabled}
      mistake={mistakeCreatureId === creature.id}
      resolution={resolution?.creatureId === creature.id ? resolution : null}
      onAction={onCreatureAction}
    />
  ));
}

interface CreatureFieldProps {
  readonly creatures: readonly CreatureViewModel[];
  readonly disabled: boolean;
  readonly mistakeCreatureId: string | null;
  readonly onCreatureAction: (
    creature: CreatureViewModel,
    action: CreatureAction,
  ) => void;
  readonly resolution: CreatureResolution | null;
}
