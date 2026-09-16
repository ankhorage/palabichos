import type { GameScene } from '../../../../../types/gameplay';

/*** Render level, health, category, and collection progress above the playfield. */
export function GameHeader({ scene }: GameHeaderProps) {
  return (
    <>
      <header className="game-hud">
        <div className="level-chip">NIVEL {scene.level.number}</div>
        <div className="health" aria-label={`${scene.health} vidas`}>
          {Array.from({ length: scene.health }, (_, index) => (
            <span key={index} aria-hidden="true">
              ♥
            </span>
          ))}
        </div>
      </header>

      <section className="task-panel" aria-labelledby="task-title">
        <div>
          <p className="task-kicker">ENCUENTRA</p>
          <h1 id="task-title">{scene.level.title}</h1>
        </div>
        <div
          className="progress"
          aria-label={`${scene.collectedCount} de ${scene.level.targetCount}`}
        >
          <strong>{scene.collectedCount}</strong>
          <span>/ {scene.level.targetCount}</span>
        </div>
      </section>
    </>
  );
}

interface GameHeaderProps {
  readonly scene: GameScene;
}
