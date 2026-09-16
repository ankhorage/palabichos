import './gameplay.css';
import './interaction.css';
import './lifecycle.css';
import './resolution.css';

import type { GameScene } from '../../../../../types/gameplay';
import { GameHeader } from './GameHeader';
import { GamePlayfield } from './GamePlayfield';
import { useGameInteraction } from './useGameInteraction';
import { usePlayerMovement } from './usePlayerMovement';

/*** Compose the mobile-first Palabichos scene from gameplay state and browser adapters. */
export function GameScreen({ scene }: GameScreenProps) {
  const movement = usePlayerMovement();
  const interaction = useGameInteraction(scene, movement.xPercent, movement.reset);

  return (
    <main className="game-screen" aria-label="Palabichos">
      <div className="sky-glow" aria-hidden="true" />
      <div className="stars" aria-hidden="true" />
      <GameHeader scene={interaction.scene} />
      <GamePlayfield
        scene={interaction.scene}
        shot={interaction.shot}
        invulnerable={interaction.invulnerable}
        letterProjectiles={interaction.letterProjectiles}
        mistakeCreatureId={interaction.mistakeCreatureId}
        playerXPercent={movement.xPercent}
        resolution={interaction.resolution}
        movementHandlers={movement.handlers}
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
