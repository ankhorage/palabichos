import { type PointerEventHandler, useRef } from 'react';

import type {
  CreatureAction,
  CreatureResolution,
  CreatureViewModel,
  GameScene,
  HorizontalBounds,
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
      <div className="movement-zone" style={movementZoneStyle}>
        <span
          className={props.correctFeedback === null ? undefined : 'movement-zone-feedback--correct'}
          aria-live="polite"
        >
          {props.correctFeedback === null ? 'mueve' : `✓ ${props.correctFeedback}`}
        </span>
      </div>
      <div className="baseline" aria-hidden="true" />
      <GamePhaseOverlay scene={props.scene} onRestart={props.onRestart} />
    </section>
  );
}

/*** Render interactive actors and measure their browser geometry at projectile lane crossings. */
function PlayfieldActors(props: PlayfieldActorsProps) {
  const playerElementRef = useRef<HTMLDivElement>(null);

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
          onCrossPlayerLane={(projectileId, projectileBounds) =>
            props.onLetterProjectileCrossPlayerLane(
              projectileId,
              projectileBounds,
              readHorizontalBounds(playerElementRef.current),
            )
          }
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
        elementRef={playerElementRef}
        hitPhase={props.hitPhase}
        xPercent={props.playerXPercent}
        invulnerable={props.invulnerable}
      />
    </>
  );
}

/*** Read one rendered element's horizontal browser bounds for collision resolution. */
function readHorizontalBounds(element: HTMLElement | null): HorizontalBounds | null {
  if (element === null) return null;
  const bounds = element.getBoundingClientRect();
  return { left: bounds.left, right: bounds.right };
}

interface GamePlayfieldProps extends PlayfieldActorsProps {
  readonly correctFeedback: string | null;
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
    projectileBounds: HorizontalBounds,
    playerBounds: HorizontalBounds | null,
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
