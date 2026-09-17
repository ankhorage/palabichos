import {
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import type {
  GameScene,
  LetterProjectileSpec,
  PlayerHitPhase,
} from '../../../../../types/gameplay';
import { applyProjectileHit } from '../../../application/use-cases/applyProjectileHit';

/*** Resolve projectile hits and own the configured K.O./respawn feedback sequence. */
export function useProjectileDamage({
  playerXPercent,
  resetPlayer,
  sceneRef,
  setLetterProjectiles,
  setScene,
}: ProjectileDamageInput) {
  const [hitPhase, setHitPhase] = useState<PlayerHitPhase>('idle');
  const [invulnerable, setInvulnerable] = useState(false);
  const playerXRef = useRef(playerXPercent);
  const invulnerableRef = useRef(false);
  const timers = useHitTimers();

  useEffect(() => {
    playerXRef.current = playerXPercent;
  }, [playerXPercent]);
  useEffect(() => () => clearHitTimers(timers), [timers]);

  const resetInvulnerability = useCallback(() => {
    clearHitTimers(timers);
    invulnerableRef.current = false;
    setInvulnerable(false);
    setHitPhase('idle');
  }, [timers]);
  const onLetterProjectileCrossPlayerLane = useCallback(
    (projectileId: string, impactXPercent: number) =>
      resolveLaneCrossing(projectileId, impactXPercent, {
        invulnerableRef,
        playerXRef,
        resetPlayer,
        sceneRef,
        setHitPhase,
        setInvulnerable,
        setLetterProjectiles,
        setScene,
        timers,
      }),
    [resetPlayer, sceneRef, setLetterProjectiles, setScene, timers],
  );

  return {
    hitPhase,
    hitStopped: hitPhase === 'hitstop',
    invulnerable,
    onLetterProjectileCrossPlayerLane,
    resetInvulnerability,
  };
}

interface ProjectileDamageInput {
  readonly playerXPercent: number;
  readonly resetPlayer: () => void;
  readonly sceneRef: MutableRefObject<GameScene>;
  readonly setLetterProjectiles: Dispatch<SetStateAction<readonly LetterProjectileSpec[]>>;
  readonly setScene: Dispatch<SetStateAction<GameScene>>;
}

interface HitContext {
  readonly invulnerableRef: MutableRefObject<boolean>;
  readonly playerXRef: MutableRefObject<number>;
  readonly resetPlayer: () => void;
  readonly sceneRef: MutableRefObject<GameScene>;
  readonly setHitPhase: Dispatch<SetStateAction<PlayerHitPhase>>;
  readonly setInvulnerable: Dispatch<SetStateAction<boolean>>;
  readonly setLetterProjectiles: Dispatch<SetStateAction<readonly LetterProjectileSpec[]>>;
  readonly setScene: Dispatch<SetStateAction<GameScene>>;
  readonly timers: HitTimers;
}

interface HitTimers {
  readonly finish: MutableRefObject<number | null>;
  readonly hitStop: MutableRefObject<number | null>;
  readonly invulnerability: MutableRefObject<number | null>;
  readonly respawn: MutableRefObject<number | null>;
}

/*** Create stable timeout refs for one hit-feedback lifecycle. */
function useHitTimers(): HitTimers {
  const finish = useRef<number | null>(null);
  const hitStop = useRef<number | null>(null);
  const invulnerability = useRef<number | null>(null);
  const respawn = useRef<number | null>(null);
  return useMemo(
    () => ({ finish, hitStop, invulnerability, respawn }),
    [finish, hitStop, invulnerability, respawn],
  );
}

/*** Resolve one lane crossing against the current configured player hitbox. */
function resolveLaneCrossing(projectileId: string, impactXPercent: number, context: HitContext) {
  const scene = context.sceneRef.current;
  if (
    Math.abs(impactXPercent - context.playerXRef.current) >
    scene.gameplayConfig.playerHitRadiusPercent
  ) {
    return;
  }

  context.setLetterProjectiles((current) =>
    current.filter((projectile) => projectile.id !== projectileId),
  );
  const result = applyProjectileHit(scene, context.invulnerableRef.current);
  if (!result.damaged) return;

  context.sceneRef.current = result.scene;
  context.setScene(result.scene);
  startHitFeedback(result.scene, context);
}

/*** Run hitstop, K.O. disappearance, centered respawn, blinking, and invulnerability. */
function startHitFeedback(scene: GameScene, context: HitContext) {
  const config = scene.gameplayConfig;
  clearHitTimers(context.timers);
  context.invulnerableRef.current = true;
  context.setInvulnerable(true);
  context.setHitPhase('hitstop');
  context.timers.hitStop.current = window.setTimeout(
    () => context.setHitPhase('hidden'),
    config.hitStopMs,
  );
  context.timers.respawn.current = window.setTimeout(() => {
    context.resetPlayer();
    context.setHitPhase('respawning');
  }, config.hitStopMs + config.playerRespawnDelayMs);
  context.timers.finish.current = window.setTimeout(
    () => context.setHitPhase('idle'),
    config.hitStopMs + config.playerRespawnDelayMs + config.playerRespawnBlinkMs,
  );
  context.timers.invulnerability.current = window.setTimeout(() => {
    context.invulnerableRef.current = false;
    context.setInvulnerable(false);
  }, config.invulnerabilityMs);
}

/*** Clear every browser timeout owned by the hit-feedback lifecycle. */
function clearHitTimers(timers: HitTimers) {
  clearTimer(timers.finish);
  clearTimer(timers.hitStop);
  clearTimer(timers.invulnerability);
  clearTimer(timers.respawn);
}

/*** Clear one optional browser timeout. */
function clearTimer(timerRef: MutableRefObject<number | null>) {
  if (timerRef.current === null) return;
  window.clearTimeout(timerRef.current);
  timerRef.current = null;
}
