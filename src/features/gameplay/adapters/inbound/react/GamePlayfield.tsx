import type { PointerEventHandler } from 'react';

import type {
  CreatureAction,
  CreatureResolution,
  CreatureViewModel,
  GameScene,
  LetterProjectileSpec,
  ShotViewModel,
} from '../../../../../types/gameplay';
import { CreatureField } from './CreatureField';
import { GamePhaseOverlay } from './GamePhaseOverlay';
import { LetterProjectile } from './LetterProjectile';
import { PlayerCharacter } from './PlayerCharacter';
import { ShotTrail } from './ShotTrail';

/*** Render the interactive creature field, dodge band, projectiles, and player. */
export function GamePlayfield({
  invulnerable,
  letterProjectiles,
  mistakeCreatureId,
  movementHandlers,
  onCreatureAction,
  onLetterProjectileComplete,
  onLetterProjectileCrossPlayerLane,
  onRestart,
  playerXPercent,
  resolution,
  scene,
  shot,
}: GamePlayfieldProps) {
  return (
    <section
      className="playfield"
      aria-label={`Categoría ${scene.level.title}`}
      onContextMenu={(event) => event.preventDefault()}
      {...movementHandlers}
    >
      <div className="moon" aria-hidden="true" />
      <div className="hill hill-back" aria-hidden="true" />
      <div className="hill hill-front" aria-hidden="true" />
      <CreatureField
        creatures={scene.creatures}
        disabled={resolution !== null || scene.phase !== 'playing'}
        mistakeCreatureId={mistakeCreatureId}
        resolution={resolution}
        onCreatureAction={onCreatureAction}
      />
      {letterProjectiles.map((projectile) => (
        <LetterProjectile
          key={projectile.id}
          projectile={projectile}
          onComplete={onLetterProjectileComplete}
          onCrossPlayerLane={onLetterProjectileCrossPlayerLane}
        />
      ))}
      {shot === null ? null : <ShotTrail key={shot.id} shot={shot} />}
      <div className="movement-zone" aria-hidden="true">
        <span>mueve</span>
      </div>
      <div className="baseline" aria-hidden="true" />
      <PlayerCharacter xPercent={playerXPercent} invulnerable={invulnerable} />
      <GamePhaseOverlay scene={scene} onRestart={onRestart} />
    </section>
  );
}

interface GamePlayfieldProps {
  readonly invulnerable: boolean;
  readonly letterProjectiles: readonly LetterProjectileSpec[];
  readonly mistakeCreatureId: string | null;
  readonly movementHandlers: MovementHandlers;
  readonly onCreatureAction: (creature: CreatureViewModel, action: CreatureAction) => void;
  readonly onLetterProjectileComplete: (projectileId: string) => void;
  readonly onLetterProjectileCrossPlayerLane: (
    projectileId: string,
    impactXPercent: number,
  ) => void;
  readonly onRestart: () => void;
  readonly playerXPercent: number;
  readonly resolution: CreatureResolution | null;
  readonly scene: GameScene;
  readonly shot: ShotViewModel | null;
}

interface MovementHandlers {
  readonly onPointerCancel: PointerEventHandler<HTMLElement>;
  readonly onPointerDown: PointerEventHandler<HTMLElement>;
  readonly onPointerMove: PointerEventHandler<HTMLElement>;
  readonly onPointerUp: PointerEventHandler<HTMLElement>;
}
