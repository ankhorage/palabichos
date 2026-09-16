import { useEffect, useRef, useState } from 'react';

import type {
  CreatureAction,
  CreatureViewModel,
  GameScene,
  ShotViewModel,
} from '../../../../../types/gameplay';
import { applyCreatureAction } from '../../../application/use-cases/applyCreatureAction';

/*** Own mutable React feedback while delegating gameplay decisions to the pure application use case. */
export function useGameInteraction(initialScene: GameScene, playerXPercent: number) {
  const [scene, setScene] = useState(initialScene);
  const [shot, setShot] = useState<ShotViewModel | null>(null);
  const [mistakeCreatureId, setMistakeCreatureId] = useState<string | null>(null);
  const sceneRef = useRef(initialScene);
  const shotSequenceRef = useRef(0);
  const shotTimerRef = useRef<number | null>(null);
  const mistakeTimerRef = useRef<number | null>(null);
  const context: GameInteractionContext = {
    mistakeTimerRef,
    playerXPercent,
    sceneRef,
    setMistakeCreatureId,
    setScene,
    setShot,
    shotSequenceRef,
    shotTimerRef,
  };

  useEffect(
    () => () => {
      clearTimer(shotTimerRef);
      clearTimer(mistakeTimerRef);
    },
    [mistakeTimerRef, shotTimerRef],
  );

  return {
    mistakeCreatureId,
    scene,
    shot,
    onCreatureAction: (creature: CreatureViewModel, action: CreatureAction) =>
      handleCreatureAction(creature, action, context),
  };
}

interface GameInteractionContext {
  readonly mistakeTimerRef: { current: number | null };
  readonly playerXPercent: number;
  readonly sceneRef: { current: GameScene };
  readonly setMistakeCreatureId: (creatureId: string | null) => void;
  readonly setScene: (scene: GameScene) => void;
  readonly setShot: (shot: ShotViewModel | null) => void;
  readonly shotSequenceRef: { current: number };
  readonly shotTimerRef: { current: number | null };
}

/*** Apply a creature action and schedule short-lived shot or mistake presentation feedback. */
function handleCreatureAction(
  creature: CreatureViewModel,
  action: CreatureAction,
  context: GameInteractionContext,
) {
  if (action === 'shoot') showShot(creature, context);

  const result = applyCreatureAction(context.sceneRef.current, creature.id, action);
  context.sceneRef.current = result.scene;
  context.setScene(result.scene);
  if (result.outcome === 'mistake') showMistake(creature.id, context);
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

/*** Clear one optional browser timeout held by the interaction adapter. */
function clearTimer(timerRef: { current: number | null }) {
  if (timerRef.current === null) return;
  window.clearTimeout(timerRef.current);
  timerRef.current = null;
}

const SHOT_VISIBLE_MS = 220;
const MISTAKE_VISIBLE_MS = 420;
