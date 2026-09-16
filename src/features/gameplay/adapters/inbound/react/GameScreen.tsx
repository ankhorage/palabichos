import type { GameScene, CreatureViewModel } from '../../../../../types/gameplay';
import './gameplay.css';

/*** Render the first mobile-first Palabichos game scene. */
export function GameScreen({ scene }: GameScreenProps) {
  return (
    <main className="game-screen" aria-label="Palabichos">
      <div className="sky-glow" aria-hidden="true" />
      <div className="stars" aria-hidden="true" />

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
        <div className="progress" aria-label={`${scene.collectedCount} de ${scene.level.targetCount}`}>
          <strong>{scene.collectedCount}</strong>
          <span>/ {scene.level.targetCount}</span>
        </div>
      </section>

      <section className="playfield" aria-label={`Categoría ${scene.level.title}`}>
        <div className="moon" aria-hidden="true" />
        <div className="hill hill-back" aria-hidden="true" />
        <div className="hill hill-front" aria-hidden="true" />

        {scene.creatures.map((creature) => (
          <WordCreature key={creature.id} creature={creature} />
        ))}

        <div className="baseline" aria-hidden="true" />
        <PlayerCharacter />
      </section>

      <footer className="game-footer">
        <span className="status-dot" aria-hidden="true" />
        <span>20 palabras · sin prisa</span>
      </footer>
    </main>
  );
}

type GameScreenProps = {
  readonly scene: GameScene;
};

type WordCreatureProps = {
  readonly creature: CreatureViewModel;
};

/*** Render one readable word creature with calm ambient movement. */
function WordCreature({ creature }: WordCreatureProps) {
  const style = {
    left: `${creature.xPercent}%`,
    top: `${creature.yPercent}%`,
    animationDelay: `${creature.animationDelaySeconds}s`,
    animationDuration: `${creature.animationDurationSeconds}s`,
  };

  return (
    <div
      className={`word-creature word-creature--${creature.variant} word-creature--${creature.motion}`}
      style={style}
      aria-label={creature.word.text}
    >
      <div className="antenna antenna-left" aria-hidden="true" />
      <div className="antenna antenna-right" aria-hidden="true" />
      <div className="creature-face" aria-hidden="true">
        <span className="eye" />
        <span className="eye" />
      </div>
      <span className="word-label">{creature.word.text}</span>
      <div className="creature-feet" aria-hidden="true">
        <span />
        <span />
      </div>
    </div>
  );
}

/*** Render the stationary player avatar at the play baseline. */
function PlayerCharacter() {
  return (
    <div className="player" aria-label="Jugador">
      <div className="player-shadow" aria-hidden="true" />
      <div className="player-head" aria-hidden="true">
        <span className="player-eye player-eye-left" />
        <span className="player-eye player-eye-right" />
      </div>
      <div className="player-body" aria-hidden="true">
        <span className="player-emblem">P</span>
      </div>
      <div className="player-arm player-arm-left" aria-hidden="true" />
      <div className="player-arm player-arm-right" aria-hidden="true" />
    </div>
  );
}
