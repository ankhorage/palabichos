import type { PointerEventHandler } from 'react';

import type {
  CreatureAction,
  CreatureViewModel,
  GameScene,
  LetterProjectileSpec,
  ShotViewModel,
} from '../../../../../types/gameplay';
import { LetterProjectile } from './LetterProjectile';
import { PlayerCharacter } from './PlayerCharacter';
import { ShotTrail } from './ShotTrail';
import { WordCreature } from './WordCreature';

/*** Render the interactive creature field, dodge band, projectiles, and player. */
export function GamePlayfield({
  letterProjectiles,
  mistakeCreatureId,
  movementHandlers,
  onCreatureAction,
  onLetterProjectileComplete,
  playerXPercent,
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
      {scene.creatures.map((creature) => (
        <WordCreature
          key={creature.id}
          creature={creature}
          mistake={mistakeCreatureId === creature.id}
          onAction={onCreatureAction}
        />
      ))}
      {letterProjectiles.map((projectile) => (
        <LetterProjectile
          key={projectile.id}
          projectile={projectile}
          onComplete={onLetterProjectileComplete}
        />
      ))}
      {shot === null ? null : <ShotTrail key={shot.id} shot={shot} />}
      <div className="movement-zone" aria-hidden="true">
        <span>mueve</span>
      </div>
      <div className="baseline" aria-hidden="true" />
      <PlayerCharacter xPercent={playerXPercent} />
    </section>
  );
}

interface GamePlayfieldProps {
  readonly letterProjectiles: readonly LetterProjectileSpec[];
  readonly mistakeCreatureId: string | null;
  readonly movementHandlers: MovementHandlers;
  readonly onCreatureAction: (creature: CreatureViewModel, action: CreatureAction) => void;
  readonly onLetterProjectileComplete: (projectileId: string) => void;
  readonly playerXPercent: number;
  readonly scene: GameScene;
  readonly shot: ShotViewModel | null;
}

interface MovementHandlers {
  readonly onPointerCancel: PointerEventHandler<HTMLElement>;
  readonly onPointerDown: PointerEventHandler<HTMLElement>;
  readonly onPointerMove: PointerEventHandler<HTMLElement>;
  readonly onPointerUp: PointerEventHandler<HTMLElement>;
}
