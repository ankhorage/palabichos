import type { ShotViewModel } from '../../../../../types/gameplay';

/*** Render one configured projectile travelling from the player lane to a selected creature. */
export function ShotTrail({ durationMs, playerLaneYPercent, shot }: ShotTrailProps) {
  return (
    <svg className="shot-layer" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <line
        className="shot-line"
        x1={shot.fromXPercent}
        y1={playerLaneYPercent}
        x2={shot.toXPercent}
        y2={shot.toYPercent}
        style={{ animationDuration: `${durationMs}ms` }}
      />
      <circle className="shot-projectile" cx={shot.fromXPercent} cy={playerLaneYPercent} r="1.25">
        <animate
          attributeName="cx"
          from={shot.fromXPercent}
          to={shot.toXPercent}
          dur={`${durationMs}ms`}
          fill="freeze"
        />
        <animate
          attributeName="cy"
          from={playerLaneYPercent}
          to={shot.toYPercent}
          dur={`${durationMs}ms`}
          fill="freeze"
        />
      </circle>
    </svg>
  );
}

interface ShotTrailProps {
  readonly durationMs: number;
  readonly playerLaneYPercent: number;
  readonly shot: ShotViewModel;
}
