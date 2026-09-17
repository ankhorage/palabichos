import type { RefObject } from 'react';

import type { PlayerHitPhase } from '../../../../../types/gameplay';

/*** Render the player avatar with K.O., hidden, and respawn feedback phases. */
export function PlayerCharacter({
  elementRef,
  hitPhase,
  invulnerable,
  xPercent,
}: PlayerCharacterProps) {
  const knockedOut = hitPhase === 'hitstop';
  const className = [
    'player',
    invulnerable ? 'player--invulnerable' : '',
    hitPhase === 'hitstop' ? 'player--hitstop' : '',
    hitPhase === 'hidden' ? 'player--hidden' : '',
    hitPhase === 'respawning' ? 'player--respawning' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={elementRef}
      className={className}
      style={{ left: `${xPercent}%` }}
      aria-label="Jugador"
    >
      <div className="player-shadow" aria-hidden="true" />
      <div className="player-head" aria-hidden="true">
        <span className="player-eye player-eye-left">{knockedOut ? '×' : null}</span>
        <span className="player-eye player-eye-right">{knockedOut ? '×' : null}</span>
      </div>
      <div className="player-body" aria-hidden="true">
        <span className="player-emblem">P</span>
      </div>
      <div className="player-arm player-arm-left" aria-hidden="true" />
      <div className="player-arm player-arm-right" aria-hidden="true" />
    </div>
  );
}

interface PlayerCharacterProps {
  readonly elementRef: RefObject<HTMLDivElement | null>;
  readonly hitPhase: PlayerHitPhase;
  readonly invulnerable: boolean;
  readonly xPercent: number;
}
