import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type {
  CreatureAction,
  CreatureViewModel,
  GameScene,
  ShotViewModel,
} from '../../../../../types/gameplay';
import { applyCreatureAction } from '../../../application/use-cases/applyCreatureAction';
import { PlayerCharacter } from './PlayerCharacter';
import { ShotTrail } from './ShotTrail';
import { WordCreature } from './WordCreature';
import './gameplay.css';
import './interaction.css';

/*** Render the mobile-first Palabichos game scene and coordinate pointer-driven gameplay feedback. */
export function GameScreen({ scene }: GameScreenProps) {
  const [currentScene, setCurrentScene] = useState(scene);
  const [playerXPercent, setPlayerXPercent] = useState(50);
  const [shot, setShot] = useState<ShotViewModel | null>(null);
  const [mistakeCreatureId, setMistakeCreatureId] = useState<string | null>(null);
  const sceneRef = useRef(scene);
  const movementPointerIdRef = useRef<number | null>(null);
  const shotSequenceRef = useRef(0);
  const shotTimerRef = useRef<number | null>(null);
  const mistakeTimerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (shotTimerRef.current !== null) {
        window.clearTimeout(shotTimerRef.current);
      }
      if (mistakeTimerRef.current !== null) {
        window.clearTimeout(mistakeTimerRef.current);
      }
    },
    [],
  );

  /*** Apply one creature interaction and coordinate transient shot or mistake feedback. */
  function handleCreatureAction(creature: CreatureViewModel, action: CreatureAction) {
    if (action === 'shoot') {
      shotSequenceRef.current += 1;
      setShot({
        id: shotSequenceRef.current,
        fromXPercent: playerXPercent,
        toXPercent: creature.xPercent,
        toYPercent: creature.yPercent,
      });

      if (shotTimerRef.current !== null) {
        window.clearTimeout(shotTimerRef.current);
      }
      shotTimerRef.current = window.setTimeout(() => {
        setShot(null);
        shotTimerRef.current = null;
      }, SHOT_VISIBLE_MS);
    }

    const result = applyCreatureAction(sceneRef.current, creature.id, action);
    sceneRef.current = result.scene;
    setCurrentScene(result.scene);

    if (result.outcome === 'mistake') {
      setMistakeCreatureId(creature.id);
      if (mistakeTimerRef.current !== null) {
        window.clearTimeout(mistakeTimerRef.current);
      }
      mistakeTimerRef.current = window.setTimeout(() => {
        setMistakeCreatureId(null);
        mistakeTimerRef.current = null;
      }, MISTAKE_VISIBLE_MS);
    }
  }

  /*** Begin horizontal player movement only when the pointer starts inside the lower movement zone. */
  function handlePlayfieldPointerDown(event: ReactPointerEvent<HTMLElement>) {
    if (event.button !== 0 || movementPointerIdRef.current !== null) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const yPercent = ((event.clientY - bounds.top) / bounds.height) * 100;

    if (yPercent < MOVEMENT_ZONE_START_PERCENT) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    movementPointerIdRef.current = event.pointerId;
    updatePlayerPosition(event);
  }

  /*** Follow horizontal pointer movement while the lower movement zone owns the active pointer. */
  function handlePlayfieldPointerMove(event: ReactPointerEvent<HTMLElement>) {
    if (movementPointerIdRef.current === event.pointerId) {
      updatePlayerPosition(event);
    }
  }

  /*** Finish lower-zone movement and release pointer capture. */
  function handlePlayfieldPointerUp(event: ReactPointerEvent<HTMLElement>) {
    if (movementPointerIdRef.current !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    movementPointerIdRef.current = null;
  }

  /*** Map one playfield pointer coordinate into a safe horizontal player position. */
  function updatePlayerPosition(event: ReactPointerEvent<HTMLElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const rawPercent = ((event.clientX - bounds.left) / bounds.width) * 100;
    setPlayerXPercent(Math.min(PLAYER_MAX_X_PERCENT, Math.max(PLAYER_MIN_X_PERCENT, rawPercent)));
  }

  return (
    <main className="game-screen" aria-label="Palabichos">
      <div className="sky-glow" aria-hidden="true" />
      <div className="stars" aria-hidden="true" />

      <header className="game-hud">
        <div className="level-chip">NIVEL {currentScene.level.number}</div>
        <div className="health" aria-label={`${currentScene.health} vidas`}>
          {Array.from({ length: currentScene.health }, (_, index) => (
            <span key={index} aria-hidden="true">
              ♥
            </span>
          ))}
        </div>
      </header>

      <section className="task-panel" aria-labelledby="task-title">
        <div>
          <p className="task-kicker">ENCUENTRA</p>
          <h1 id="task-title">{currentScene.level.title}</h1>
        </div>
        <div
          className="progress"
          aria-label={`${currentScene.collectedCount} de ${currentScene.level.targetCount}`}
        >
          <strong>{currentScene.collectedCount}</strong>
          <span>/ {currentScene.level.targetCount}</span>
        </div>
      </section>

      <section
        className="playfield"
        aria-label={`Categoría ${currentScene.level.title}`}
        onPointerDown={handlePlayfieldPointerDown}
        onPointerMove={handlePlayfieldPointerMove}
        onPointerUp={handlePlayfieldPointerUp}
        onPointerCancel={handlePlayfieldPointerUp}
      >
        <div className="moon" aria-hidden="true" />
        <div className="hill hill-back" aria-hidden="true" />
        <div className="hill hill-front" aria-hidden="true" />

        {currentScene.creatures.map((creature) => (
          <WordCreature
            key={creature.id}
            creature={creature}
            mistake={mistakeCreatureId === creature.id}
            onAction={handleCreatureAction}
          />
        ))}

        {shot === null ? null : <ShotTrail key={shot.id} shot={shot} />}
        <div className="movement-zone" aria-hidden="true">
          <span>mueve</span>
        </div>
        <div className="baseline" aria-hidden="true" />
        <PlayerCharacter xPercent={playerXPercent} />
      </section>

      <footer className="game-footer">
        <span className="status-dot" aria-hidden="true" />
        <span>toca = dispara · mantén = recoge</span>
      </footer>
    </main>
  );
}

type GameScreenProps = {
  readonly scene: GameScene;
};

const MOVEMENT_ZONE_START_PERCENT = 75;
const PLAYER_MIN_X_PERCENT = 9;
const PLAYER_MAX_X_PERCENT = 91;
const SHOT_VISIBLE_MS = 220;
const MISTAKE_VISIBLE_MS = 420;
