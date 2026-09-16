import {
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
} from 'react';

import type {
  GameScene,
  LetterProjectileSpec,
  ShotViewModel,
} from '../../../../../types/gameplay';
import { advanceGameScene } from '../../../application/use-cases/advanceGameScene';
import { restartGameScene } from '../../../application/use-cases/restartGameScene';

/*** Bind level-complete timing and game-over restart behavior to pure lifecycle transitions. */
export function useGameLifecycle({
  resetInvulnerability,
  resetPlayer,
  scene,
  sceneRef,
  setLetterProjectiles,
  setMistakeCreatureId,
  setScene,
  setShot,
}: GameLifecycleInput) {
  const transitionTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (scene.phase !== 'level-complete') return undefined;

    clearTransitionTimer(transitionTimerRef);
    transitionTimerRef.current = window.setTimeout(() => {
      replaceScene(advanceGameScene(sceneRef.current), {
        resetInvulnerability,
        resetPlayer,
        sceneRef,
        setLetterProjectiles,
        setMistakeCreatureId,
        setScene,
        setShot,
      });
    }, LEVEL_COMPLETE_VISIBLE_MS);

    return () => clearTransitionTimer(transitionTimerRef);
  }, [
    resetInvulnerability,
    resetPlayer,
    scene.phase,
    sceneRef,
    setLetterProjectiles,
    setMistakeCreatureId,
    setScene,
    setShot,
  ]);

  const restartCurrentLevel = useCallback(() => {
    clearTransitionTimer(transitionTimerRef);
    replaceScene(restartGameScene(sceneRef.current), {
      resetInvulnerability,
      resetPlayer,
      sceneRef,
      setLetterProjectiles,
      setMistakeCreatureId,
      setScene,
      setShot,
    });
  }, [
    resetInvulnerability,
    resetPlayer,
    sceneRef,
    setLetterProjectiles,
    setMistakeCreatureId,
    setScene,
    setShot,
  ]);

  return { restartCurrentLevel };
}

interface GameLifecycleInput {
  readonly resetInvulnerability: () => void;
  readonly resetPlayer: () => void;
  readonly scene: GameScene;
  readonly sceneRef: MutableRefObject<GameScene>;
  readonly setLetterProjectiles: Dispatch<SetStateAction<readonly LetterProjectileSpec[]>>;
  readonly setMistakeCreatureId: Dispatch<SetStateAction<string | null>>;
  readonly setScene: Dispatch<SetStateAction<GameScene>>;
  readonly setShot: Dispatch<SetStateAction<ShotViewModel | null>>;
}

interface SceneReplacementContext {
  readonly resetInvulnerability: () => void;
  readonly resetPlayer: () => void;
  readonly sceneRef: MutableRefObject<GameScene>;
  readonly setLetterProjectiles: Dispatch<SetStateAction<readonly LetterProjectileSpec[]>>;
  readonly setMistakeCreatureId: Dispatch<SetStateAction<string | null>>;
  readonly setScene: Dispatch<SetStateAction<GameScene>>;
  readonly setShot: Dispatch<SetStateAction<ShotViewModel | null>>;
}

/*** Replace the active scene and clear transient browser presentation state. */
function replaceScene(nextScene: GameScene, context: SceneReplacementContext) {
  context.sceneRef.current = nextScene;
  context.setScene(nextScene);
  context.setLetterProjectiles([]);
  context.setMistakeCreatureId(null);
  context.setShot(null);
  context.resetInvulnerability();
  context.resetPlayer();
}

/*** Clear the pending automatic level transition timeout. */
function clearTransitionTimer(timerRef: MutableRefObject<number | null>) {
  if (timerRef.current === null) return;
  window.clearTimeout(timerRef.current);
  timerRef.current = null;
}

const LEVEL_COMPLETE_VISIBLE_MS = 1200;
