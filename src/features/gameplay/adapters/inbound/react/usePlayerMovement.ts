import { type PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from 'react';

/*** Bind touch, mouse, trackpad, and keyboard input to calm horizontal player movement. */
export function usePlayerMovement(enabled = true) {
  const [xPercent, setXPercent] = useState(50);
  const pointerIdRef = useRef<number | null>(null);
  const context: PlayerMovementContext = { pointerIdRef, setXPercent };

  useEffect(() => bindKeyboardMovement(enabled, setXPercent), [enabled]);

  return {
    xPercent,
    handlers: {
      onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => finishMovement(event, context),
      onPointerDown: (event: ReactPointerEvent<HTMLElement>) => startMovement(event, context, enabled),
      onPointerMove: (event: ReactPointerEvent<HTMLElement>) => movePlayer(event, context, enabled),
      onPointerUp: (event: ReactPointerEvent<HTMLElement>) => finishMovement(event, context),
    },
  };
}

interface PlayerMovementContext {
  readonly pointerIdRef: { current: number | null };
  readonly setXPercent: (xPercent: number | ((xPercent: number) => number)) => void;
}

/*** Capture a primary touch/pen pointer only when it starts inside the lower movement zone. */
function startMovement(
  event: ReactPointerEvent<HTMLElement>,
  context: PlayerMovementContext,
  enabled: boolean,
) {
  if (!enabled || event.button !== 0 || context.pointerIdRef.current !== null) return;
  if (event.pointerType === 'mouse') return;
  if (!isInsideMovementZone(event)) return;

  event.preventDefault();
  event.currentTarget.setPointerCapture(event.pointerId);
  context.pointerIdRef.current = event.pointerId;
  setPlayerPosition(event, context);
}

/*** Follow touch drag or desktop hover movement while the pointer is inside the dodge band. */
function movePlayer(
  event: ReactPointerEvent<HTMLElement>,
  context: PlayerMovementContext,
  enabled: boolean,
) {
  if (!enabled) return;
  if (context.pointerIdRef.current === event.pointerId) {
    setPlayerPosition(event, context);
    return;
  }
  if (event.pointerType === 'mouse' && isInsideMovementZone(event)) setPlayerPosition(event, context);
}

/*** Release playfield pointer capture at the end of a touch movement gesture. */
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
  context.setXPercent(clampPlayerX(rawPercent));
}

/*** Return whether a pointer event lies inside the broad lower dodge band. */
function isInsideMovementZone(event: ReactPointerEvent<HTMLElement>) {
  const bounds = event.currentTarget.getBoundingClientRect();
  const yPercent = ((event.clientY - bounds.top) / bounds.height) * 100;
  return yPercent >= MOVEMENT_ZONE_START_PERCENT;
}

/*** Register desktop Arrow/A/D movement and return its effect cleanup. */
function bindKeyboardMovement(
  enabled: boolean,
  setXPercent: (xPercent: number | ((xPercent: number) => number)) => void,
) {
  if (!enabled) return undefined;

  const handleKeyDown = (event: KeyboardEvent) => {
    const direction = keyboardDirection(event.key);
    if (direction === 0) return;
    event.preventDefault();
    setXPercent((xPercent) => clampPlayerX(xPercent + direction * KEYBOARD_STEP_PERCENT));
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}

/*** Map supported desktop movement keys to a horizontal direction. */
function keyboardDirection(key: string) {
  if (key === 'ArrowLeft' || key.toLowerCase() === 'a') return -1;
  if (key === 'ArrowRight' || key.toLowerCase() === 'd') return 1;
  return 0;
}

/*** Clamp one requested player coordinate to the safe visible horizontal range. */
function clampPlayerX(xPercent: number) {
  return Math.min(PLAYER_MAX_X_PERCENT, Math.max(PLAYER_MIN_X_PERCENT, xPercent));
}

const MOVEMENT_ZONE_START_PERCENT = 65;
const PLAYER_MIN_X_PERCENT = 9;
const PLAYER_MAX_X_PERCENT = 91;
const KEYBOARD_STEP_PERCENT = 5;
