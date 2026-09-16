import { type Dispatch, type SetStateAction, useEffect, useRef, useState } from 'react';

import type {
  CreatureAction,
  CreatureViewModel,
  GameScene,
  LetterProjectileSpec,
  ShotViewModel,
} from '../../../../../types/gameplay';
import { applyCreatureAction } from '../../../application/use-cases/applyCreatureAction';
import { createLetterProjectiles } from '../../../application/use-cases/createLetterProjectiles';
import { useGameLifecycle } from './useGameLifecycle';
import { useProjectileDamage } from './useProjectileDamage';

/*** Own mutable React feedback while delegating gameplay decisions to pure application use cases. */
export function useGameInteraction(
  initialScene: GameScene,
  playerXPercent: number,
  resetPlayer: () => void,
) {
  const [scene, setScene] = useState(initialScene);
  const feedback = useTransientFeedbackState();
  const sceneRef = useRef(initialScene);
  const shotSequenceRef = useRef(0);
  const letterSequenceRef = useRef(0);
  const shotTimerRef = useRef<number | null>(null);
  const mistakeTimerRef = useRef<number | null>(null);
  const damage = useProjectileDamage({
    playerXPercent,
    sceneRef,
    setLetterProjectiles: feedback.setLetterProjectiles,
    setScene,
  });
  const lifecycle = useGameLifecycle({
    resetInvulnerability: damage.resetInvulnerability,
    resetPlayer,
    scene,
    sceneRef,
    setLetterProjectiles: feedback.setLetterProjectiles,
    setMistakeCreatureId: feedback.setMistakeCreatureId,
    setScene,
    setShot: feedback.setShot,
  });
  const context: GameInteractionContext = {
    letterSequenceRef,
    mistakeTimerRef,
    playerXPercent,
    sceneRef,
    setLetterProjectiles: feedback.setLetterProjectiles,
    setMistakeCreatureId: feedback.setMistakeCreatureId,
    setScene,
    setShot: feedback.setShot,
    shotSequenceRef,
    shotTimerRef,
  };

  useEffect(() => () => clearFeedbackTimers(shotTimerRef, mistakeTimerRef), []);

  return {
    ...damage,
    ...lifecycle,
    letterProjectiles: feedback.letterProjectiles,
    mistakeCreatureId: feedback.mistakeCreatureId,
    scene,
    shot: feedback.shot,
    onCreatureAction: (creature: CreatureViewModel, action: CreatureAction) =>
      handleCreatureAction(creature, action, context),
    onLetterProjectileComplete: (projectileId: string) =>
      removeLetterProjectile(projectileId, feedback.setLetterProjectiles),
  };
}

interface GameInteractionContext {
  readonly letterSequenceRef: { current: number };
  readonly mistakeTimerRef: { current: number | null };
  readonly playerXPercent: number;
  readonly sceneRef: { current: GameScene };
  readonly setLetterProjectiles: Dispatch<SetStateAction<readonly LetterProjectileSpec[]>>;
  readonly setMistakeCreatureId: Dispatch<SetStateAction<string | null>>;
  readonly setScene: Dispatch<SetStateAction<GameScene>>;
  readonly setShot: Dispatch<SetStateAction<ShotViewModel | null>>;
  readonly shotSequenceRef: { current: number };
  readonly shotTimerRef: { current: number | null };
}

/*** Own short-lived React presentation state separately from the gameplay scene. */
function useTransientFeedbackState() {
  const [shot, setShot] = useState<ShotViewModel | null>(null);
  const [letterProjectiles, setLetterProjectiles] = useState<readonly LetterProjectileSpec[]>([]);
  const [mistakeCreatureId, setMistakeCreatureId] = useState<string | null>(null);
  return {
    letterProjectiles,
    mistakeCreatureId,
    setLetterProjectiles,
    setMistakeCreatureId,
    setShot,
    shot,
  };
}

/*** Apply a creature action and schedule short-lived shot, projectile, or mistake feedback. */
function handleCreatureAction(
  creature: CreatureViewModel,
  action: CreatureAction,
  context: GameInteractionContext,
) {
  if (context.sceneRef.current.phase !== 'playing') return;
  if (action === 'shoot') showShot(creature, context);

  const result = applyCreatureAction(context.sceneRef.current, creature.id, action);
  context.sceneRef.current = result.scene;
  context.setScene(result.scene);
  if (result.outcome === 'destroyed') emitLetterProjectiles(creature, context);
  if (result.outcome === 'mistake') showMistake(creature.id, context);
}

/*** Emit one deterministic falling projectile per displayed letter. */
function emitLetterProjectiles(creature: CreatureViewModel, context: GameInteractionContext) {
  context.letterSequenceRef.current += 1;
  const projectiles = createLetterProjectiles(creature, context.letterSequenceRef.current);
  context.setLetterProjectiles((current) => [...current, ...projectiles]);
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
  context.shotTimerRef.current = window.setTimeout(() => context.setShot(null), SHOT_VISIBLE_MS);
}

/*** Mark the incorrectly handled creature briefly and then clear its feedback state. */
function showMistake(creatureId: string, context: GameInteractionContext) {
  context.setMistakeCreatureId(creatureId);
  clearTimer(context.mistakeTimerRef);
  context.mistakeTimerRef.current = window.setTimeout(
    () => context.setMistakeCreatureId(null),
    MISTAKE_VISIBLE_MS,
  );
}

/*** Clear the browser feedback timers when the interaction adapter unmounts. */
function clearFeedbackTimers(
  shotTimerRef: { current: number | null },
  mistakeTimerRef: { current: number | null },
) {
  clearTimer(shotTimerRef);
  clearTimer(mistakeTimerRef);
}

/*** Clear one optional browser timeout held by the interaction adapter. */
function clearTimer(timerRef: { current: number | null }) {
  if (timerRef.current === null) return;
  window.clearTimeout(timerRef.current);
  timerRef.current = null;
}

const SHOT_VISIBLE_MS = 220;
const MISTAKE_VISIBLE_MS = 420;
