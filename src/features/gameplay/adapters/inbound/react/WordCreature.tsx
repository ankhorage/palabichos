import type {
  CreatureAction,
  CreatureResolution,
  CreatureViewModel,
} from '../../../../../types/gameplay';
import { CollectRing } from './CollectRing';
import { useCreatureGesture } from './useCreatureGesture';
import { WordCreatureLabel } from './WordCreatureLabel';

/*** Render one readable word creature with translated resolution feedback. */
export function WordCreature({
  creature,
  disabled,
  mistake,
  onAction,
  resolution,
}: WordCreatureProps) {
  const { handlers, holding } = useCreatureGesture(creature, onAction);
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
    holding ? 'word-creature--holding' : '',
    resolution === null ? '' : 'word-creature--resolving',
    mistake ? 'word-creature--mistake' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      className={className}
      style={style}
      aria-label={resolution?.translation ?? creature.word.text}
      disabled={disabled}
      {...handlers}
    >
      <CollectRing active={holding && !disabled} />
      <span className="antenna antenna-left" aria-hidden="true" />
      <span className="antenna antenna-right" aria-hidden="true" />
      <span className="creature-face" aria-hidden="true">
        <span className="eye" />
        <span className="eye" />
      </span>
      <WordCreatureLabel text={creature.word.text} resolution={resolution} />
      <span className="creature-feet" aria-hidden="true">
        <span />
        <span />
      </span>
    </button>
  );
}

interface WordCreatureProps {
  readonly creature: CreatureViewModel;
  readonly disabled: boolean;
  readonly mistake: boolean;
  readonly onAction: (creature: CreatureViewModel, action: CreatureAction) => void;
  readonly resolution: CreatureResolution | null;
}
