import './gameplay.css';
import './interaction.css';
import './lifecycle.css';
import './resolution.css';

import type { GameScene } from '../../../../../types/gameplay';
import { GameHeader } from './GameHeader';
import { GamePlayfield } from './GamePlayfield';
import { useGameInteraction } from './useGameInteraction';

/*** Compose the mobile-first Palabichos scene from gameplay state and browser adapters. */
export function GameScreen({ scene }: GameScreenProps) {
  const interaction = useGameInteraction(scene);

  return (
    <main className="game-screen" aria-label="Palabichos">
      <div className="sky-glow" aria-hidden="true" />
      <div className="stars" aria-hidden="true" />
      <GameHeader scene={interaction.scene} />
      <GamePlayfield
        scene={interaction.scene}
        shot={interaction.shot}
        hitPhase={interaction.hitPhase}
        hitStopped={interaction.hitStopped}
        invulnerable={interaction.invulnerable}
        letterProjectiles={interaction.letterProjectiles}
        mistakeCreatureId={interaction.mistakeCreatureId}
        playerXPercent={interaction.playerXPercent}
        resolution={interaction.resolution}
        movementHandlers={interaction.movementHandlers}
        onCreatureAction={interaction.onCreatureAction}
        onLetterProjectileComplete={interaction.onLetterProjectileComplete}
        onLetterProjectileCrossPlayerLane={interaction.onLetterProjectileCrossPlayerLane}
        onRestart={interaction.restartCurrentLevel}
      />
      <footer className="game-footer">
        <span className="status-dot" aria-hidden="true" />
        <span>toca = dispara · mantén = recoge</span>
      </footer>
    </main>
  );
}

interface GameScreenProps {
  readonly scene: GameScene;
}
