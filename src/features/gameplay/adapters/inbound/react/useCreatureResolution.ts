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

/*** Resolve correct creatures immediately while preserving delayed wrong-answer feedback. */
export function useCreatureResolution(input: CreatureResolutionInput) {
  const [resolution, setResolution] = useState<CreatureResolution | null>(null);
  const [correctFeedback, setCorrectFeedback] = useState<string | null>(null);
  const resolutionRef = useRef<CreatureResolution | null>(null);
  const resolutionSequenceRef = useRef(0);
  const resolutionTimerRef = useRef<number | null>(null);
  const correctFeedbackTimerRef = useRef<number | null>(null);
  const context: CreatureResolutionContext = {
    ...input,
    correctFeedbackTimerRef,
    resolutionRef,
    resolutionSequenceRef,
    resolutionTimerRef,
    setCorrectFeedback,
    setResolution,
  };

  useEffect(
    () => () => {
      clearTimer(resolutionTimerRef);
      clearTimer(correctFeedbackTimerRef);
    },
    [],
  );

  return {
    correctFeedback,
    resolution,
    beginCreatureResolution: (creature: CreatureViewModel, action: CreatureAction) =>
      beginCreatureResolution(creature, action, context),
  };
}

interface CreatureResolutionInput {
  readonly letterSequenceRef: MutableRefObject<number>;
  readonly onCorrectWordResolved: (wordId: string) => void;
  readonly randomSource: () => number;
  readonly sceneRef: MutableRefObject<GameScene>;
  readonly setLetterProjectiles: Dispatch<SetStateAction<readonly LetterProjectileSpec[]>>;
  readonly setScene: Dispatch<SetStateAction<GameScene>>;
}

interface CreatureResolutionContext extends CreatureResolutionInput {
  readonly correctFeedbackTimerRef: MutableRefObject<number | null>;
  readonly resolutionRef: MutableRefObject<CreatureResolution | null>;
  readonly resolutionSequenceRef: MutableRefObject<number>;
  readonly resolutionTimerRef: MutableRefObject<number | null>;
  readonly setCorrectFeedback: Dispatch<SetStateAction<string | null>>;
  readonly setResolution: Dispatch<SetStateAction<CreatureResolution | null>>;
}

/*** Start one creature result, immediately committing correct shots and delaying mistakes. */
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
  if (resolution.isCorrect) {
    completeCreatureResolution(creature, resolution, context);
    showCorrectFeedback(resolution.translation, context);
    return true;
  }

  context.resolutionRef.current = resolution;
  context.setResolution(resolution);
  clearTimer(context.resolutionTimerRef);
  context.resolutionTimerRef.current = window.setTimeout(
    () => completeCreatureResolution(creature, resolution, context),
    context.sceneRef.current.gameplayConfig.resolutionFeedbackMs,
  );
  return true;
}

/*** Commit one shot, capture correct vocabulary, rebuild the board, and emit mistake letters. */
function completeCreatureResolution(
  creature: CreatureViewModel,
  resolution: CreatureResolution,
  context: CreatureResolutionContext,
) {
  const scene = context.sceneRef.current;
  const result = applyCreatureAction(scene, creature.id, context.randomSource());
  context.sceneRef.current = result.scene;
  context.setScene(result.scene);
  if (result.vocabWord !== null) context.onCorrectWordResolved(result.vocabWord.id);
  if (!resolution.isCorrect) emitLetterProjectiles(creature, scene, context);
  clearActiveResolution(context);
}

/*** Show the latest correct German translation in the movement zone for the configured duration. */
function showCorrectFeedback(translation: string, context: CreatureResolutionContext) {
  context.setCorrectFeedback(translation);
  clearTimer(context.correctFeedbackTimerRef);
  context.correctFeedbackTimerRef.current = window.setTimeout(() => {
    context.setCorrectFeedback(null);
    context.correctFeedbackTimerRef.current = null;
  }, context.sceneRef.current.gameplayConfig.correctFeedbackVisibleMs);
}

/*** Release one delayed wrong-answer resolution lock. */
function clearActiveResolution(context: CreatureResolutionContext) {
  context.resolutionRef.current = null;
  context.setResolution(null);
  context.resolutionTimerRef.current = null;
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
