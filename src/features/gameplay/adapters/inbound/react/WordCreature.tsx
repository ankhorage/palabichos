import { useEffect, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react';
import type { CreatureAction, CreatureViewModel } from '../../../../../types/gameplay';

/*** Render one word creature and translate pointer hold-or-tap gestures into gameplay actions. */
export function WordCreature({ creature, mistake, onAction }: WordCreatureProps) {
  const [holding, setHolding] = useState(false);
  const holdTimerRef = useRef<number | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const pointerStartRef = useRef<PointerStart | null>(null);
  const completedRef = useRef(false);
  const cancelledRef = useRef(false);

  useEffect(
    () => () => {
      if (holdTimerRef.current !== null) {
        window.clearTimeout(holdTimerRef.current);
      }
    },
    [],
  );

  /*** Start the forgiving collection hold while preserving a short tap as a shot. */
  function handlePointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    if (event.button !== 0 || activePointerIdRef.current !== null) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    activePointerIdRef.current = event.pointerId;
    pointerStartRef.current = { x: event.clientX, y: event.clientY };
    completedRef.current = false;
    cancelledRef.current = false;
    setHolding(true);

    holdTimerRef.current = window.setTimeout(() => {
      completedRef.current = true;
      holdTimerRef.current = null;
      setHolding(false);
      onAction(creature, 'collect');
    }, COLLECT_HOLD_MS);
  }

  /*** Cancel collection when the pointer moves far enough to indicate an unintended hold. */
  function handlePointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    if (activePointerIdRef.current !== event.pointerId || pointerStartRef.current === null) {
      return;
    }

    const distance = Math.hypot(
      event.clientX - pointerStartRef.current.x,
      event.clientY - pointerStartRef.current.y,
    );

    if (distance > POINTER_CANCEL_DISTANCE_PX) {
      cancelledRef.current = true;
      clearHoldTimer();
      setHolding(false);
    }
  }

  /*** Resolve an unfinished primary pointer gesture as a single shot. */
  function handlePointerUp(event: ReactPointerEvent<HTMLButtonElement>) {
    if (activePointerIdRef.current !== event.pointerId) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    clearHoldTimer();
    releasePointer(event);
    setHolding(false);

    if (!completedRef.current && !cancelledRef.current) {
      onAction(creature, 'shoot');
    }
  }

  /*** Cancel a pointer gesture without triggering either gameplay action. */
  function handlePointerCancel(event: ReactPointerEvent<HTMLButtonElement>) {
    if (activePointerIdRef.current !== event.pointerId) {
      return;
    }

    clearHoldTimer();
    releasePointer(event);
    cancelledRef.current = true;
    setHolding(false);
  }

  /*** Clear an active collection timer without changing the selected action state. */
  function clearHoldTimer() {
    if (holdTimerRef.current !== null) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }

  /*** Release pointer capture and reset pointer-specific tracking after a gesture ends. */
  function releasePointer(event: ReactPointerEvent<HTMLButtonElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    activePointerIdRef.current = null;
    pointerStartRef.current = null;
  }

  const style = {
    left: `${creature.xPercent}%`,
    top: `${creature.yPercent}%`,
    animationDelay: `${creature.animationDelaySeconds}s`,
    animationDuration: `${creature.animationDurationSeconds}s`,
  };
  const className = [
    'word-creature',
    `word-creature--${creature.variant}`,
    `word-creature--${creature.motion}`,
    holding ? 'word-creature--holding' : '',
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
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onClick={(event: ReactMouseEvent<HTMLButtonElement>) => {
        if (event.detail === 0) {
          onAction(creature, 'shoot');
        }
      }}
    >
      <svg className="collect-ring" viewBox="0 0 64 64" aria-hidden="true">
        <circle className="collect-ring-track" cx="32" cy="32" r="28" />
        {holding ? (
          <circle
            className="collect-ring-progress"
            cx="32"
            cy="32"
            r="28"
            style={{ animationDuration: `${COLLECT_HOLD_MS}ms` }}
          />
        ) : null}
      </svg>
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

type WordCreatureProps = {
  readonly creature: CreatureViewModel;
  readonly mistake: boolean;
  readonly onAction: (creature: CreatureViewModel, action: CreatureAction) => void;
};

type PointerStart = {
  readonly x: number;
  readonly y: number;
};

const COLLECT_HOLD_MS = 420;
const POINTER_CANCEL_DISTANCE_PX = 34;
