import type { ShotViewModel } from '../../../../../types/gameplay';

/*** Render one short projectile travelling from the player to a selected creature. */
export function ShotTrail({ shot }: ShotTrailProps) {
  return (
    <svg className="shot-layer" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <line
        className="shot-line"
        x1={shot.fromXPercent}
        y1="88"
        x2={shot.toXPercent}
        y2={shot.toYPercent}
      />
      <circle className="shot-projectile" cx={shot.fromXPercent} cy="88" r="1.25">
        <animate
          attributeName="cx"
          from={shot.fromXPercent}
          to={shot.toXPercent}
          dur="180ms"
          fill="freeze"
        />
        <animate attributeName="cy" from="88" to={shot.toYPercent} dur="180ms" fill="freeze" />
      </circle>
    </svg>
  );
}

interface ShotTrailProps {
  readonly shot: ShotViewModel;
}
