import {
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import type { GameScene, LetterProjectileSpec } from '../../../../../types/gameplay';
import { applyProjectileHit } from '../../../application/use-cases/applyProjectileHit';

/*** Resolve letter/player lane crossings and expose temporary invulnerability state. */
export function useProjectileDamage({
  playerXPercent,
  sceneRef,
  setLetterProjectiles,
  setScene,
}: ProjectileDamageInput) {
  const [invulnerable, setInvulnerable] = useState(false);
  const playerXRef = useRef(playerXPercent);
  const invulnerableRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    playerXRef.current = playerXPercent;
  }, [playerXPercent]);
  useEffect(() => () => clearInvulnerabilityTimer(timerRef), []);

  const resetInvulnerability = useCallback(() => {
    invulnerableRef.current = false;
    clearInvulnerabilityTimer(timerRef);
    setInvulnerable(false);
  }, []);
  const onLetterProjectileCrossPlayerLane = useCallback(
    (projectileId: string, impactXPercent: number) => {
      if (Math.abs(impactXPercent - playerXRef.current) > PLAYER_HIT_RADIUS_PERCENT) return;

      setLetterProjectiles((current) =>
        current.filter((projectile) => projectile.id !== projectileId),
      );
      const result = applyProjectileHit(sceneRef.current, invulnerableRef.current);
      if (!result.damaged) return;

      sceneRef.current = result.scene;
      setScene(result.scene);
      startInvulnerability(invulnerableRef, timerRef, setInvulnerable);
    },
    [sceneRef, setLetterProjectiles, setScene],
  );

  return { invulnerable, onLetterProjectileCrossPlayerLane, resetInvulnerability };
}

interface ProjectileDamageInput {
  readonly playerXPercent: number;
  readonly sceneRef: MutableRefObject<GameScene>;
  readonly setLetterProjectiles: Dispatch<SetStateAction<readonly LetterProjectileSpec[]>>;
  readonly setScene: Dispatch<SetStateAction<GameScene>>;
}

/*** Start or refresh the short post-hit invulnerability window. */
function startInvulnerability(
  invulnerableRef: MutableRefObject<boolean>,
  timerRef: MutableRefObject<number | null>,
  setInvulnerable: (value: boolean) => void,
) {
  invulnerableRef.current = true;
  setInvulnerable(true);
  clearInvulnerabilityTimer(timerRef);
  timerRef.current = window.setTimeout(() => {
    invulnerableRef.current = false;
    timerRef.current = null;
    setInvulnerable(false);
  }, INVULNERABILITY_MS);
}

/*** Clear the browser timeout used by the damage adapter. */
function clearInvulnerabilityTimer(timerRef: MutableRefObject<number | null>) {
  if (timerRef.current === null) return;
  window.clearTimeout(timerRef.current);
  timerRef.current = null;
}

const PLAYER_HIT_RADIUS_PERCENT = 7;
const INVULNERABILITY_MS = 700;
