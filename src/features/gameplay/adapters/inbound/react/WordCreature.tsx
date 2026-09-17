import type {
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from 'react';

import type {
  CreatureAction,
  CreatureResolution,
  CreatureViewModel,
  GameplayConfig,
} from '../../../../../types/gameplay';
import { WordCreatureLabel } from './WordCreatureLabel';

/*** Render one readable word creature that fires immediately on primary pointer-down. */
export function WordCreature({
  creature,
  disabled,
  gameplayConfig,
  onAction,
  resolution,
}: WordCreatureProps) {
  return (
    <button
      type="button"
      className={createWordCreatureClassName(creature, resolution)}
      style={createWordCreatureStyle(creature, gameplayConfig, resolution)}
      aria-label={resolution?.translation ?? creature.word.text}
      disabled={disabled}
      onClick={(event) => handleKeyboardClick(event, creature, onAction)}
      onPointerDown={(event) => handlePointerDown(event, creature, onAction)}
    >
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

/*** Fire immediately for one primary pointer interaction without moving the player beneath it. */
function handlePointerDown(
  event: ReactPointerEvent<HTMLButtonElement>,
  creature: CreatureViewModel,
  onAction: (creature: CreatureViewModel, action: CreatureAction) => void,
) {
  if (event.button !== 0) return;
  event.preventDefault();
  event.stopPropagation();
  onAction(creature, 'shoot');
}

/*** Preserve keyboard button activation without duplicating pointer-generated click events. */
function handleKeyboardClick(
  event: ReactMouseEvent<HTMLButtonElement>,
  creature: CreatureViewModel,
  onAction: (creature: CreatureViewModel, action: CreatureAction) => void,
) {
  if (event.detail !== 0) return;
  event.stopPropagation();
  onAction(creature, 'shoot');
}

/*** Build the creature classes for idle, reward, and mistake presentation states. */
function createWordCreatureClassName(
  creature: CreatureViewModel,
  resolution: CreatureResolution | null,
) {
  return [
    'word-creature',
    `word-creature--${creature.variant}`,
    `word-creature--${creature.motion}`,
    resolution === null ? '' : 'word-creature--resolving',
    resolution?.isCorrect === true ? 'word-creature--reward' : '',
    resolution?.isCorrect === false ? 'word-creature--resolution-mistake' : '',
  ]
    .filter(Boolean)
    .join(' ');
}

/*** Build configured animation and position styles for one creature. */
function createWordCreatureStyle(
  creature: CreatureViewModel,
  gameplayConfig: GameplayConfig,
  resolution: CreatureResolution | null,
) {
  return {
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
}
