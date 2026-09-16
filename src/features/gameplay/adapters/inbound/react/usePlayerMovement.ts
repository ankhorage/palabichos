import { type PointerEvent as ReactPointerEvent, useRef, useState } from 'react';

/*** Bind the lower playfield band to calm horizontal player press-and-drag movement. */
export function usePlayerMovement() {
  const [xPercent, setXPercent] = useState(50);
  const pointerIdRef = useRef<number | null>(null);
  const context: PlayerMovementContext = { pointerIdRef, setXPercent };

  return {
    xPercent,
    onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => finishMovement(event, context),
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => startMovement(event, context),
    onPointerMove: (event: ReactPointerEvent<HTMLElement>) => movePlayer(event, context),
    onPointerUp: (event: ReactPointerEvent<HTMLElement>) => finishMovement(event, context),
  };
}

interface PlayerMovementContext {
  readonly pointerIdRef: { current: number | null };
  readonly setXPercent: (xPercent: number) => void;
}

/*** Capture a primary pointer only when it starts inside the visible lower movement zone. */
function startMovement(event: ReactPointerEvent<HTMLElement>, context: PlayerMovementContext) {
  if (event.button !== 0 || context.pointerIdRef.current !== null) return;
  const bounds = event.currentTarget.getBoundingClientRect();
  const yPercent = ((event.clientY - bounds.top) / bounds.height) * 100;
  if (yPercent < MOVEMENT_ZONE_START_PERCENT) return;

  event.preventDefault();
  event.currentTarget.setPointerCapture(event.pointerId);
  context.pointerIdRef.current = event.pointerId;
  setPlayerPosition(event, context);
}

/*** Follow horizontal movement while the playfield owns the active movement pointer. */
function movePlayer(event: ReactPointerEvent<HTMLElement>, context: PlayerMovementContext) {
  if (context.pointerIdRef.current === event.pointerId) setPlayerPosition(event, context);
}

/*** Release playfield pointer capture at the end of a movement gesture. */
function finishMovement(event: ReactPointerEvent<HTMLElement>, context: PlayerMovementContext) {
  if (context.pointerIdRef.current !== event.pointerId) return;
  if (event.currentTarget.hasPointerCapture(event.pointerId)) {
    event.currentTarget.releasePointerCapture(event.pointerId);
  }
  context.pointerIdRef.current = null;
}

/*** Convert a playfield pointer coordinate into the safe horizontal player range. */
function setPlayerPosition(event: ReactPointerEvent<HTMLElement>, context: PlayerMovementContext) {
  const bounds = event.currentTarget.getBoundingClientRect();
  const rawPercent = ((event.clientX - bounds.left) / bounds.width) * 100;
  context.setXPercent(Math.min(PLAYER_MAX_X_PERCENT, Math.max(PLAYER_MIN_X_PERCENT, rawPercent)));
}

const MOVEMENT_ZONE_START_PERCENT = 75;
const PLAYER_MIN_X_PERCENT = 9;
const PLAYER_MAX_X_PERCENT = 91;
