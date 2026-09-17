import { type Dispatch, type SetStateAction, useEffect, useRef, useState } from 'react';

import type {
  CreatureAction,
  CreatureViewModel,
  GameScene,
  LetterProjectileSpec,
  ShotViewModel,
} from '../../../../../types/gameplay';
import { useCreatureResolution } from './useCreatureResolution';
import { useGameLifecycle } from './useGameLifecycle';
import { usePlayerMovement } from './usePlayerMovement';
import { useProjectileDamage } from './useProjectileDamage';

/*** Own browser gameplay adapters while delegating decisions to pure application use cases. */
export function useGameInteraction(initialScene: GameScene) {
  const [scene, setScene] = useState(initialScene);
  const movement = usePlayerMovement(scene.gameplayConfig, scene.phase === 'playing');
  const feedback = useTransientFeedbackState();
  const runtime = useInteractionRuntime(initialScene);
  const damage = useProjectileDamage({
    playerXPercent: movement.xPercent,
    resetPlayer: movement.reset,
    sceneRef: runtime.sceneRef,
    setLetterProjectiles: feedback.setLetterProjectiles,
    setScene,
  });
  const resolution = useCreatureResolution({
    letterSequenceRef: runtime.letterSequenceRef,
    sceneRef: runtime.sceneRef,
    setLetterProjectiles: feedback.setLetterProjectiles,
    setScene,
  });
  const lifecycle = useGameLifecycle({
    resetInvulnerability: damage.resetInvulnerability,
    resetPlayer: movement.reset,
    scene,
    sceneRef: runtime.sceneRef,
    setLetterProjectiles: feedback.setLetterProjectiles,
    setScene,
    setShot: feedback.setShot,
  });
  const context = createInteractionContext({
    feedback,
    playerXPercent: movement.xPercent,
    resolution,
    runtime,
  });

  return {
    ...damage,
    ...lifecycle,
    letterProjectiles: feedback.letterProjectiles,
    movementHandlers: movement.handlers,
    playerXPercent: movement.xPercent,
    resolution: resolution.resolution,
    scene,
    shot: feedback.shot,
    onCreatureAction: (creature: CreatureViewModel, action: CreatureAction) =>
      handleCreatureAction(creature, action, context),
    onLetterProjectileComplete: (projectileId: string) =>
      removeLetterProjectile(projectileId, feedback.setLetterProjectiles),
  };
}

interface GameInteractionContext {
  readonly beginCreatureResolution: (
    creature: CreatureViewModel,
    action: CreatureAction,
  ) => boolean;
  readonly playerXPercent: number;
  readonly sceneRef: { current: GameScene };
  readonly setShot: Dispatch<SetStateAction<ShotViewModel | null>>;
  readonly shotSequenceRef: { current: number };
  readonly shotTimerRef: { current: number | null };
}

interface InteractionRuntime {
  readonly letterSequenceRef: { current: number };
  readonly sceneRef: { current: GameScene };
  readonly shotSequenceRef: { current: number };
  readonly shotTimerRef: { current: number | null };
}

interface TransientFeedbackState {
  readonly letterProjectiles: readonly LetterProjectileSpec[];
  readonly setLetterProjectiles: Dispatch<SetStateAction<readonly LetterProjectileSpec[]>>;
  readonly setShot: Dispatch<SetStateAction<ShotViewModel | null>>;
  readonly shot: ShotViewModel | null;
}

interface CreatureResolutionBinding {
  readonly beginCreatureResolution: (
    creature: CreatureViewModel,
    action: CreatureAction,
  ) => boolean;
}

/*** Own browser refs and feedback timer cleanup separately from interaction orchestration. */
function useInteractionRuntime(initialScene: GameScene): InteractionRuntime {
  const sceneRef = useRef(initialScene);
  const shotSequenceRef = useRef(0);
  const letterSequenceRef = useRef(0);
  const shotTimerRef = useRef<number | null>(null);

  useEffect(() => () => clearTimer(shotTimerRef), []);

  return { letterSequenceRef, sceneRef, shotSequenceRef, shotTimerRef };
}

/*** Own short-lived React presentation state separately from the gameplay scene. */
function useTransientFeedbackState(): TransientFeedbackState {
  const [shot, setShot] = useState<ShotViewModel | null>(null);
  const [letterProjectiles, setLetterProjectiles] = useState<readonly LetterProjectileSpec[]>([]);
  return {
    letterProjectiles,
    setLetterProjectiles,
    setShot,
    shot,
  };
}

/*** Build the event context from React scene state and browser runtime refs. */
function createInteractionContext({
  feedback,
  playerXPercent,
  resolution,
  runtime,
}: CreateInteractionContextInput): GameInteractionContext {
  return {
    beginCreatureResolution: resolution.beginCreatureResolution,
    playerXPercent,
    sceneRef: runtime.sceneRef,
    setShot: feedback.setShot,
    shotSequenceRef: runtime.shotSequenceRef,
    shotTimerRef: runtime.shotTimerRef,
  };
}

interface CreateInteractionContextInput {
  readonly feedback: TransientFeedbackState;
  readonly playerXPercent: number;
  readonly resolution: CreatureResolutionBinding;
  readonly runtime: InteractionRuntime;
}

/*** Start one translated creature resolution and show an immediate shot trail when applicable. */
function handleCreatureAction(
  creature: CreatureViewModel,
  action: CreatureAction,
  context: GameInteractionContext,
) {
  if (!context.beginCreatureResolution(creature, action)) return;
  if (action === 'shoot') showShot(creature, context);
}

/*** Remove one completed falling letter from React presentation state. */
function removeLetterProjectile(
  projectileId: string,
  setProjectiles: Dispatch<SetStateAction<readonly LetterProjectileSpec[]>>,
) {
  setProjectiles((current) => current.filter((projectile) => projectile.id !== projectileId));
}

/*** Show a short projectile from the current player position to the selected creature. */
function showShot(creature: CreatureViewModel, context: GameInteractionContext) {
  context.shotSequenceRef.current += 1;
  context.setShot({
    id: context.shotSequenceRef.current,
    fromXPercent: context.playerXPercent,
    toXPercent: creature.xPercent,
    toYPercent: creature.yPercent,
  });
  clearTimer(context.shotTimerRef);
  context.shotTimerRef.current = window.setTimeout(
    () => context.setShot(null),
    context.sceneRef.current.gameplayConfig.shotVisibleMs,
  );
}

/*** Clear one optional browser timeout held by the interaction adapter. */
function clearTimer(timerRef: { current: number | null }) {
  if (timerRef.current === null) return;
  window.clearTimeout(timerRef.current);
  timerRef.current = null;
}
