import {
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
  useEffect,
  useRef,
  useState,
} from 'react';

import type {
  CreatureAction,
  CreatureResolution,
  CreatureViewModel,
  GameScene,
  LetterProjectileSpec,
} from '../../../../../types/gameplay';
import { applyCreatureAction } from '../../../application/use-cases/applyCreatureAction';
import { createCreatureResolution } from '../../../application/use-cases/createCreatureResolution';
import { createLetterProjectiles } from '../../../application/use-cases/createLetterProjectiles';
import { MISTAKE_VISIBLE_MS, RESOLUTION_FEEDBACK_MS } from '../../../constants/interaction';

/*** Delay every creature consequence behind one calm translated feedback phase. */
export function useCreatureResolution(input: CreatureResolutionInput) {
  const [resolution, setResolution] = useState<CreatureResolution | null>(null);
  const resolutionRef = useRef<CreatureResolution | null>(null);
  const resolutionSequenceRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const context: CreatureResolutionContext = {
    ...input,
    resolutionRef,
    resolutionSequenceRef,
    setResolution,
    timerRef,
  };

  useEffect(() => () => clearTimer(timerRef), []);

  return {
    resolution,
    beginCreatureResolution: (creature: CreatureViewModel, action: CreatureAction) =>
      beginCreatureResolution(creature, action, context),
  };
}

interface CreatureResolutionInput {
  readonly letterSequenceRef: MutableRefObject<number>;
  readonly mistakeTimerRef: MutableRefObject<number | null>;
  readonly sceneRef: MutableRefObject<GameScene>;
  readonly setLetterProjectiles: Dispatch<SetStateAction<readonly LetterProjectileSpec[]>>;
  readonly setMistakeCreatureId: Dispatch<SetStateAction<string | null>>;
  readonly setScene: Dispatch<SetStateAction<GameScene>>;
}

interface CreatureResolutionContext extends CreatureResolutionInput {
  readonly resolutionRef: MutableRefObject<CreatureResolution | null>;
  readonly resolutionSequenceRef: MutableRefObject<number>;
  readonly setResolution: Dispatch<SetStateAction<CreatureResolution | null>>;
  readonly timerRef: MutableRefObject<number | null>;
}

/*** Start translated feedback without mutating gameplay state until the delay completes. */
function beginCreatureResolution(
  creature: CreatureViewModel,
  action: CreatureAction,
  context: CreatureResolutionContext,
) {
  if (context.sceneRef.current.phase !== 'playing' || context.resolutionRef.current !== null) {
    return false;
  }

  context.resolutionSequenceRef.current += 1;
  const resolution = createCreatureResolution(
    creature,
    action,
    context.resolutionSequenceRef.current,
  );
  context.resolutionRef.current = resolution;
  context.setResolution(resolution);
  clearTimer(context.timerRef);
  context.timerRef.current = window.setTimeout(
    () => completeCreatureResolution(creature, resolution, context),
    RESOLUTION_FEEDBACK_MS,
  );
  return true;
}

/*** Commit the delayed action, then trigger its projectile or mistake consequence. */
function completeCreatureResolution(
  creature: CreatureViewModel,
  resolution: CreatureResolution,
  context: CreatureResolutionContext,
) {
  const result = applyCreatureAction(context.sceneRef.current, creature.id, resolution.action);
  context.sceneRef.current = result.scene;
  context.setScene(result.scene);
  if (result.outcome === 'destroyed') emitLetterProjectiles(creature, context);
  if (result.outcome === 'mistake') showMistake(creature.id, context);
  context.resolutionRef.current = null;
  context.setResolution(null);
  context.timerRef.current = null;
}

/*** Emit one deterministic falling projectile per German translation letter. */
function emitLetterProjectiles(creature: CreatureViewModel, context: CreatureResolutionContext) {
  context.letterSequenceRef.current += 1;
  const projectiles = createLetterProjectiles(creature, context.letterSequenceRef.current);
  context.setLetterProjectiles((current) => [...current, ...projectiles]);
}

/*** Show the existing short mistake shake after translated feedback completes. */
function showMistake(creatureId: string, context: CreatureResolutionContext) {
  context.setMistakeCreatureId(creatureId);
  clearTimer(context.mistakeTimerRef);
  context.mistakeTimerRef.current = window.setTimeout(
    () => context.setMistakeCreatureId(null),
    MISTAKE_VISIBLE_MS,
  );
}

/*** Clear one optional browser timeout. */
function clearTimer(timerRef: MutableRefObject<number | null>) {
  if (timerRef.current === null) return;
  window.clearTimeout(timerRef.current);
  timerRef.current = null;
}
