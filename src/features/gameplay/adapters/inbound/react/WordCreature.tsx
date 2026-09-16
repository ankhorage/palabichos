import type { CreatureAction, CreatureViewModel } from '../../../../../types/gameplay';
import { CollectRing } from './CollectRing';
import { useCreatureGesture } from './useCreatureGesture';

/*** Render one readable word creature with omni-device collect-or-shoot interaction. */
export function WordCreature({ creature, mistake, onAction }: WordCreatureProps) {
  const gesture = useCreatureGesture(creature, onAction);
  const style = {
    animationDelay: `${creature.animationDelaySeconds}s`,
    animationDuration: `${creature.animationDurationSeconds}s`,
    left: `${creature.xPercent}%`,
    top: `${creature.yPercent}%`,
  };
  const className = [
    'word-creature',
    `word-creature--${creature.variant}`,
    `word-creature--${creature.motion}`,
    gesture.holding ? 'word-creature--holding' : '',
    mistake ? 'word-creature--mistake' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      className={className}
      style={style}
      aria-label={creature.word.text}
      {...gesture}
    >
      <CollectRing active={gesture.holding} />
      <span className="antenna antenna-left" aria-hidden="true" />
      <span className="antenna antenna-right" aria-hidden="true" />
      <span className="creature-face" aria-hidden="true">
        <span className="eye" />
        <span className="eye" />
      </span>
      <span className="word-label">{creature.word.text}</span>
      <span className="creature-feet" aria-hidden="true">
        <span />
        <span />
      </span>
    </button>
  );
}

interface WordCreatureProps {
  readonly creature: CreatureViewModel;
  readonly mistake: boolean;
  readonly onAction: (creature: CreatureViewModel, action: CreatureAction) => void;
}
