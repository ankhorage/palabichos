import type { GameScene } from '../../../../../types/gameplay';

/*** Render calm level-complete or game-over feedback above the paused playfield. */
export function GamePhaseOverlay({ onRestart, scene }: GamePhaseOverlayProps) {
  if (scene.phase === 'playing') return null;

  const levelComplete = scene.phase === 'level-complete';

  return (
    <div className="game-phase-overlay" aria-live="polite">
      <div className="game-phase-card">
        <strong>{levelComplete ? '¡MUY BIEN!' : 'Otra vez ✨'}</strong>
        {levelComplete ? (
          <span>Siguiente nivel…</span>
        ) : (
          <button type="button" onClick={onRestart}>
            Jugar de nuevo
          </button>
        )}
      </div>
    </div>
  );
}

interface GamePhaseOverlayProps {
  readonly onRestart: () => void;
  readonly scene: GameScene;
}
