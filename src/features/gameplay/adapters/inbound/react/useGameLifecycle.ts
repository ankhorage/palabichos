import {
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
  useEffect,
  useRef,
} from 'react';

import type { GameScene, LetterProjectileSpec, ShotViewModel } from '../../../../../types/gameplay';
import { advanceGameScene } from '../../../application/use-cases/advanceGameScene';
import { restartGameScene } from '../../../application/use-cases/restartGameScene';

/*** Bind level-complete timing and game-over restart behavior to pure lifecycle transitions. */
export function useGameLifecycle(input: GameLifecycleInput) {
  useAutomaticLevelAdvance(input);

  return {
    restartCurrentLevel: () =>
      replaceScene(restartGameScene(input.sceneRef.current), replacementContext(input)),
  };
}

interface GameLifecycleInput extends SceneReplacementContext {
  readonly scene: GameScene;
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

/*** Schedule the configured success pause before advancing to the next catalog level. */
function useAutomaticLevelAdvance({
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

    transitionTimerRef.current = window.setTimeout(
      () =>
        replaceScene(advanceGameScene(sceneRef.current), {
          resetInvulnerability,
          resetPlayer,
          sceneRef,
          setLetterProjectiles,
          setMistakeCreatureId,
          setScene,
          setShot,
        }),
      scene.gameplayConfig.levelCompleteVisibleMs,
    );
    return () => clearTransitionTimer(transitionTimerRef);
  }, [
    resetInvulnerability,
    resetPlayer,
    scene.gameplayConfig.levelCompleteVisibleMs,
    scene.phase,
    sceneRef,
    setLetterProjectiles,
    setMistakeCreatureId,
    setScene,
    setShot,
  ]);
}

/*** Select the transient-state fields needed when rebuilding a gameplay scene. */
function replacementContext({ scene: _scene, ...context }: GameLifecycleInput) {
  return context;
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
