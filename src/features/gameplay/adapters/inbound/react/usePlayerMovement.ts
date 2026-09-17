import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import type { GameplayConfig } from '../../../../../types/gameplay';

/*** Bind touch, mouse, trackpad, and keyboard input to calm horizontal player movement. */
export function usePlayerMovement(gameplayConfig: GameplayConfig, enabled = true) {
  const [xPercent, setXPercent] = useState(gameplayConfig.playerStartXPercent);
  const pointerIdRef = useRef<number | null>(null);
  const context: PlayerMovementContext = { gameplayConfig, pointerIdRef, setXPercent };
  const reset = useCallback(
    (nextXPercent = gameplayConfig.playerStartXPercent) => setXPercent(nextXPercent),
    [gameplayConfig.playerStartXPercent],
  );

  useEffect(
    () => bindKeyboardMovement(enabled, gameplayConfig, setXPercent),
    [enabled, gameplayConfig],
  );

  return {
    reset,
    xPercent,
    handlers: {
      onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => finishMovement(event, context),
      onPointerDown: (event: ReactPointerEvent<HTMLElement>) =>
        startMovement(event, context, enabled),
      onPointerMove: (event: ReactPointerEvent<HTMLElement>) => movePlayer(event, context, enabled),
      onPointerUp: (event: ReactPointerEvent<HTMLElement>) => finishMovement(event, context),
    },
  };
}

interface PlayerMovementContext {
  readonly gameplayConfig: GameplayConfig;
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
  if (!isInsideMovementZone(event, context.gameplayConfig)) return;

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
  if (event.pointerType === 'mouse' && isInsideMovementZone(event, context.gameplayConfig)) {
    setPlayerPosition(event, context);
  }
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
  context.setXPercent(clampPlayerX(rawPercent, context.gameplayConfig));
}

/*** Return whether a pointer event lies inside the broad lower dodge band. */
function isInsideMovementZone(
  event: ReactPointerEvent<HTMLElement>,
  gameplayConfig: GameplayConfig,
) {
  const bounds = event.currentTarget.getBoundingClientRect();
  const yPercent = ((event.clientY - bounds.top) / bounds.height) * 100;
  return yPercent >= gameplayConfig.movementZoneStartPercent;
}

/*** Register desktop Arrow/A/D movement and return its effect cleanup. */
function bindKeyboardMovement(
  enabled: boolean,
  gameplayConfig: GameplayConfig,
  setXPercent: (xPercent: number | ((xPercent: number) => number)) => void,
) {
  if (!enabled) return undefined;

  const handleKeyDown = (event: KeyboardEvent) => {
    const direction = keyboardDirection(event.key);
    if (direction === 0) return;
    event.preventDefault();
    setXPercent((currentXPercent) =>
      clampPlayerX(
        currentXPercent + direction * gameplayConfig.keyboardStepPercent,
        gameplayConfig,
      ),
    );
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
function clampPlayerX(xPercent: number, gameplayConfig: GameplayConfig) {
  return Math.min(
    gameplayConfig.playerMaxXPercent,
    Math.max(gameplayConfig.playerMinXPercent, xPercent),
  );
}
