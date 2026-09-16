/*** Render the player avatar at the current horizontal gameplay position. */
export function PlayerCharacter({ invulnerable, xPercent }: PlayerCharacterProps) {
  const className = invulnerable ? 'player player--invulnerable' : 'player';

  return (
    <div className={className} style={{ left: `${xPercent}%` }} aria-label="Jugador">
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

interface PlayerCharacterProps {
  readonly invulnerable: boolean;
  readonly xPercent: number;
}
