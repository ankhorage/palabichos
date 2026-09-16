import {
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from 'react';

import type { CreatureAction, CreatureViewModel } from '../../../../../types/gameplay';
import { COLLECT_HOLD_MS } from '../../../constants/interaction';

/*** Bind one creature to a forgiving tap-or-hold pointer gesture controller. */
export function useCreatureGesture(
  creature: CreatureViewModel,
  onAction: (creature: CreatureViewModel, action: CreatureAction) => void,
) {
  const [holding, setHolding] = useState(false);
  const activePointerIdRef = useRef<number | null>(null);
  const cancelledRef = useRef(false);
  const completedRef = useRef(false);
  const holdTimerRef = useRef<number | null>(null);
  const pointerStartRef = useRef<PointerStart | null>(null);
  const state: CreatureGestureState = {
    activePointerIdRef,
    cancelledRef,
    completedRef,
    holdTimerRef,
    pointerStartRef,
    setHolding,
  };

  useEffect(() => () => clearHoldTimerRef(holdTimerRef), [holdTimerRef]);

  return {
    holding,
    handlers: {
      onClick: (event: ReactMouseEvent<HTMLButtonElement>) =>
        handleKeyboardClick(event, creature, onAction),
      onPointerCancel: (event: ReactPointerEvent<HTMLButtonElement>) =>
        handlePointerCancel(event, state),
      onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) =>
        handlePointerDown(event, state, creature, onAction),
      onPointerMove: (event: ReactPointerEvent<HTMLButtonElement>) =>
        handlePointerMove(event, state),
      onPointerUp: (event: ReactPointerEvent<HTMLButtonElement>) =>
        handlePointerUp(event, state, creature, onAction),
    },
  };
}

interface CreatureGestureState {
  readonly activePointerIdRef: { current: number | null };
  readonly cancelledRef: { current: boolean };
  readonly completedRef: { current: boolean };
  readonly holdTimerRef: { current: number | null };
  readonly pointerStartRef: { current: PointerStart | null };
  readonly setHolding: (holding: boolean) => void;
}

interface PointerStart {
  readonly x: number;
  readonly y: number;
}

/*** Start collection timing while preserving a short primary gesture as a shot. */
function handlePointerDown(
  event: ReactPointerEvent<HTMLButtonElement>,
  state: CreatureGestureState,
  creature: CreatureViewModel,
  onAction: (creature: CreatureViewModel, action: CreatureAction) => void,
) {
  if (event.button !== 0 || state.activePointerIdRef.current !== null) return;

  event.preventDefault();
  event.stopPropagation();
  event.currentTarget.setPointerCapture(event.pointerId);
  state.activePointerIdRef.current = event.pointerId;
  state.pointerStartRef.current = { x: event.clientX, y: event.clientY };
  state.completedRef.current = false;
  state.cancelledRef.current = false;
  state.setHolding(true);
  state.holdTimerRef.current = window.setTimeout(() => {
    state.completedRef.current = true;
    state.holdTimerRef.current = null;
    state.setHolding(false);
    onAction(creature, 'collect');
  }, COLLECT_HOLD_MS);
}

/*** Cancel collection when pointer travel indicates the hold was unintended. */
function handlePointerMove(
  event: ReactPointerEvent<HTMLButtonElement>,
  state: CreatureGestureState,
) {
  if (
    state.activePointerIdRef.current !== event.pointerId ||
    state.pointerStartRef.current === null
  ) {
    return;
  }

  const distance = Math.hypot(
    event.clientX - state.pointerStartRef.current.x,
    event.clientY - state.pointerStartRef.current.y,
  );
  if (distance <= POINTER_CANCEL_DISTANCE_PX) return;

  state.cancelledRef.current = true;
  clearHoldTimer(state);
  state.setHolding(false);
}

/*** Resolve an unfinished primary pointer gesture as exactly one shot. */
function handlePointerUp(
  event: ReactPointerEvent<HTMLButtonElement>,
  state: CreatureGestureState,
  creature: CreatureViewModel,
  onAction: (creature: CreatureViewModel, action: CreatureAction) => void,
) {
  if (state.activePointerIdRef.current !== event.pointerId) return;

  event.preventDefault();
  event.stopPropagation();
  clearHoldTimer(state);
  releasePointer(event, state);
  state.setHolding(false);
  if (!state.completedRef.current && !state.cancelledRef.current) onAction(creature, 'shoot');
}

/*** Cancel an interrupted pointer gesture without dispatching a gameplay action. */
function handlePointerCancel(
  event: ReactPointerEvent<HTMLButtonElement>,
  state: CreatureGestureState,
) {
  if (state.activePointerIdRef.current !== event.pointerId) return;

  clearHoldTimer(state);
  releasePointer(event, state);
  state.cancelledRef.current = true;
  state.setHolding(false);
}

/*** Let keyboard activation shoot without duplicating pointer-generated click events. */
function handleKeyboardClick(
  event: ReactMouseEvent<HTMLButtonElement>,
  creature: CreatureViewModel,
  onAction: (creature: CreatureViewModel, action: CreatureAction) => void,
) {
  if (event.detail === 0) onAction(creature, 'shoot');
}

/*** Clear the active collection timeout through the gesture state. */
function clearHoldTimer(state: CreatureGestureState) {
  clearHoldTimerRef(state.holdTimerRef);
}

/*** Clear one collection timeout ref when a gesture ends or the component unmounts. */
function clearHoldTimerRef(timerRef: { current: number | null }) {
  if (timerRef.current === null) return;
  window.clearTimeout(timerRef.current);
  timerRef.current = null;
}

/*** Release browser pointer capture and reset pointer-specific gesture tracking. */
function releasePointer(event: ReactPointerEvent<HTMLButtonElement>, state: CreatureGestureState) {
  if (event.currentTarget.hasPointerCapture(event.pointerId)) {
    event.currentTarget.releasePointerCapture(event.pointerId);
  }
  state.activePointerIdRef.current = null;
  state.pointerStartRef.current = null;
}

const POINTER_CANCEL_DISTANCE_PX = 34;
