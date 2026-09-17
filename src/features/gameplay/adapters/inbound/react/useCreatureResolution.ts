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

/*** Delay every creature consequence behind one translated action-feedback phase. */
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
  readonly onCorrectWordResolved: (wordId: string) => void;
  readonly sceneRef: MutableRefObject<GameScene>;
  readonly setLetterProjectiles: Dispatch<SetStateAction<readonly LetterProjectileSpec[]>>;
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
    context.sceneRef.current.gameplayConfig.resolutionFeedbackMs,
  );
  return true;
}

/*** Commit the delayed action, capture correct vocabulary, then emit shot letters. */
function completeCreatureResolution(
  creature: CreatureViewModel,
  resolution: CreatureResolution,
  context: CreatureResolutionContext,
) {
  const scene = context.sceneRef.current;
  const result = applyCreatureAction(scene, creature.id, resolution.action);
  context.sceneRef.current = result.scene;
  context.setScene(result.scene);
  if (result.vocabWord !== null) context.onCorrectWordResolved(result.vocabWord.id);
  if (resolution.action === 'shoot') emitLetterProjectiles(creature, scene, context);
  context.resolutionRef.current = null;
  context.setResolution(null);
  context.timerRef.current = null;
}

/*** Emit one deterministic falling projectile per German translation letter. */
function emitLetterProjectiles(
  creature: CreatureViewModel,
  scene: GameScene,
  context: CreatureResolutionContext,
) {
  context.letterSequenceRef.current += 1;
  const projectiles = createLetterProjectiles(
    creature,
    context.letterSequenceRef.current,
    scene.gameplayConfig,
  );
  context.setLetterProjectiles((current) => [...current, ...projectiles]);
}

/*** Clear one optional browser timeout. */
function clearTimer(timerRef: MutableRefObject<number | null>) {
  if (timerRef.current === null) return;
  window.clearTimeout(timerRef.current);
  timerRef.current = null;
}
