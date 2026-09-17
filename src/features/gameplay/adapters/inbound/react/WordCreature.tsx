import type {
  CreatureAction,
  CreatureResolution,
  CreatureViewModel,
  GameplayConfig,
} from '../../../../../types/gameplay';
import { CollectRing } from './CollectRing';
import { useCreatureGesture } from './useCreatureGesture';
import { WordCreatureLabel } from './WordCreatureLabel';

/*** Render one readable word creature with translated action-based resolution feedback. */
export function WordCreature({
  creature,
  disabled,
  gameplayConfig,
  onAction,
  resolution,
}: WordCreatureProps) {
  const { handlers, holding } = useCreatureGesture(creature, onAction, gameplayConfig);
  const style = {
    animationDelay: `${creature.animationDelaySeconds}s`,
    animationDuration:
      resolution === null
        ? `${creature.animationDurationSeconds}s`
        : resolution.isCorrect
          ? undefined
          : `${gameplayConfig.mistakeVisibleMs}ms`,
    left: `${creature.xPercent}%`,
    top: `${creature.yPercent}%`,
  };
  const className = [
    'word-creature',
    `word-creature--${creature.variant}`,
    `word-creature--${creature.motion}`,
    holding ? 'word-creature--holding' : '',
    resolution === null ? '' : 'word-creature--resolving',
    resolution?.isCorrect === true ? 'word-creature--reward' : '',
    resolution?.isCorrect === false ? 'word-creature--resolution-mistake' : '',
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
      <CollectRing active={holding && !disabled} durationMs={gameplayConfig.collectHoldMs} />
      <span className="antenna antenna-left" aria-hidden="true" />
      <span className="antenna antenna-right" aria-hidden="true" />
      <span className="creature-face" aria-hidden="true">
        <span className="eye" />
        <span className="eye" />
      </span>
      <WordCreatureLabel
        text={creature.word.text}
        resolution={resolution}
        rewardParticleCount={gameplayConfig.rewardParticleCount}
      />
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
  readonly gameplayConfig: GameplayConfig;
  readonly onAction: (creature: CreatureViewModel, action: CreatureAction) => void;
  readonly resolution: CreatureResolution | null;
}
