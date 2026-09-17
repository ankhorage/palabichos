import type { PointerEventHandler } from 'react';

import type {
  CreatureAction,
  CreatureResolution,
  CreatureViewModel,
  GameScene,
  LetterProjectileSpec,
  PlayerHitPhase,
  ShotViewModel,
} from '../../../../../types/gameplay';
import { CreatureField } from './CreatureField';
import { GamePhaseOverlay } from './GamePhaseOverlay';
import { LetterProjectile } from './LetterProjectile';
import { PlayerCharacter } from './PlayerCharacter';
import { ShotTrail } from './ShotTrail';

/*** Render the interactive creature field, dodge band, projectiles, and player. */
export function GamePlayfield(props: GamePlayfieldProps) {
  const movementZoneStyle = {
    height: `${100 - props.scene.gameplayConfig.movementZoneStartPercent}%`,
  };
  const movementHandlers = props.hitStopped ? {} : props.movementHandlers;

  return (
    <section
      className={props.hitStopped ? 'playfield playfield--hitstop' : 'playfield'}
      aria-label={`Categoría ${props.scene.level.title}`}
      onContextMenu={(event) => event.preventDefault()}
      {...movementHandlers}
    >
      <div className="moon" aria-hidden="true" />
      <div className="hill hill-back" aria-hidden="true" />
      <div className="hill hill-front" aria-hidden="true" />
      <PlayfieldActors {...props} />
      <div className="movement-zone" style={movementZoneStyle} aria-hidden="true">
        <span>mueve</span>
      </div>
      <div className="baseline" aria-hidden="true" />
      <GamePhaseOverlay scene={props.scene} onRestart={props.onRestart} />
    </section>
  );
}

/*** Render the interactive actors whose presentation can pause during hitstop. */
function PlayfieldActors(props: PlayfieldActorsProps) {
  return (
    <>
      <CreatureField
        creatures={props.scene.creatures}
        disabled={props.resolution !== null || props.scene.phase !== 'playing' || props.hitStopped}
        gameplayConfig={props.scene.gameplayConfig}
        resolution={props.resolution}
        onCreatureAction={props.onCreatureAction}
      />
      {props.letterProjectiles.map((projectile) => (
        <LetterProjectile
          key={projectile.id}
          impacting={props.impactingProjectileId === projectile.id}
          projectile={projectile}
          onComplete={props.onLetterProjectileComplete}
          onCrossPlayerLane={props.onLetterProjectileCrossPlayerLane}
        />
      ))}
      {props.shot === null ? null : (
        <ShotTrail
          key={props.shot.id}
          shot={props.shot}
          durationMs={props.scene.gameplayConfig.shotVisibleMs}
          playerLaneYPercent={props.scene.gameplayConfig.playerLaneYPercent}
        />
      )}
      <PlayerCharacter
        hitPhase={props.hitPhase}
        xPercent={props.playerXPercent}
        invulnerable={props.invulnerable}
      />
    </>
  );
}

interface GamePlayfieldProps extends PlayfieldActorsProps {
  readonly movementHandlers: MovementHandlers;
  readonly onRestart: () => void;
}

interface PlayfieldActorsProps {
  readonly hitPhase: PlayerHitPhase;
  readonly hitStopped: boolean;
  readonly impactingProjectileId: string | null;
  readonly invulnerable: boolean;
  readonly letterProjectiles: readonly LetterProjectileSpec[];
  readonly onCreatureAction: (creature: CreatureViewModel, action: CreatureAction) => void;
  readonly onLetterProjectileComplete: (projectileId: string) => void;
  readonly onLetterProjectileCrossPlayerLane: (
    projectileId: string,
    impactXPercent: number,
  ) => void;
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
