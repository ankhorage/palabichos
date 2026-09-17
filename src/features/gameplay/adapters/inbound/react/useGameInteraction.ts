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
export function useGameInteraction(
  initialScene: GameScene,
  randomSource: () => number,
  onCorrectWordResolved: (wordId: string) => void,
) {
  const [scene, setScene] = useState(initialScene);
  const movement = usePlayerMovement(scene.gameplayConfig, scene.phase === 'playing');
  const feedback = useTransientFeedbackState();
  const runtime = useInteractionRuntime(initialScene);
  const bindings = useGameplayBindings({
    feedback,
    movement,
    onCorrectWordResolved,
    randomSource,
    runtime,
    scene,
    setScene,
  });
  const context = createInteractionContext({
    feedback,
    playerXPercent: movement.xPercent,
    resolution: bindings.resolution,
    runtime,
  });

  return {
    ...bindings.damage,
    ...bindings.lifecycle,
    letterProjectiles: feedback.letterProjectiles,
    movementHandlers: movement.handlers,
    playerXPercent: movement.xPercent,
    resolution: bindings.resolution.resolution,
    scene,
    shot: feedback.shot,
    onCreatureAction: (creature: CreatureViewModel, action: CreatureAction) =>
      handleCreatureAction(creature, action, context),
    onLetterProjectileComplete: (projectileId: string) =>
      removeLetterProjectile(projectileId, feedback.setLetterProjectiles),
  };
}

interface GameplayBindingsInput {
  readonly feedback: TransientFeedbackState;
  readonly movement: ReturnType<typeof usePlayerMovement>;
  readonly onCorrectWordResolved: (wordId: string) => void;
  readonly randomSource: () => number;
  readonly runtime: InteractionRuntime;
  readonly scene: GameScene;
  readonly setScene: Dispatch<SetStateAction<GameScene>>;
}

/*** Compose hit, resolution, and lifecycle adapters around shared interaction state. */
function useGameplayBindings(input: GameplayBindingsInput) {
  const damage = useProjectileDamage({
    playerXPercent: input.movement.xPercent,
    resetPlayer: input.movement.reset,
    sceneRef: input.runtime.sceneRef,
    setLetterProjectiles: input.feedback.setLetterProjectiles,
    setScene: input.setScene,
  });
  const resolution = useCreatureResolution({
    letterSequenceRef: input.runtime.letterSequenceRef,
    onCorrectWordResolved: input.onCorrectWordResolved,
    randomSource: input.randomSource,
    sceneRef: input.runtime.sceneRef,
    setLetterProjectiles: input.feedback.setLetterProjectiles,
    setScene: input.setScene,
  });
  const lifecycle = useGameLifecycle({
    randomSource: input.randomSource,
    resetInvulnerability: damage.resetInvulnerability,
    resetPlayer: input.movement.reset,
    scene: input.scene,
    sceneRef: input.runtime.sceneRef,
    setLetterProjectiles: input.feedback.setLetterProjectiles,
    setScene: input.setScene,
    setShot: input.feedback.setShot,
  });
  return { damage, lifecycle, resolution };
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

/*** Start translated creature feedback and show its shot trail immediately. */
function handleCreatureAction(
  creature: CreatureViewModel,
  action: CreatureAction,
  context: GameInteractionContext,
) {
  if (!context.beginCreatureResolution(creature, action)) return;
  showShot(creature, context);
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
