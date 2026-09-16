import { useEffect } from 'react';

import type { LetterProjectileSpec } from '../../../../../types/gameplay';

/*** Render one falling letter projectile and report when it crosses the player lane. */
export function LetterProjectile({
  onComplete,
  onCrossPlayerLane,
  projectile,
}: LetterProjectileProps) {
  useEffect(() => {
    const timerId = window.setTimeout(
      () => onCrossPlayerLane(projectile.id, projectile.impactXPercent),
      projectile.impactDelayMs,
    );
    return () => window.clearTimeout(timerId);
  }, [onCrossPlayerLane, projectile.id, projectile.impactDelayMs, projectile.impactXPercent]);

  return (
    <span
      className={`letter-projectile letter-projectile--${projectile.trajectory}`}
      style={{
        animationDelay: `${projectile.delayMs}ms`,
        animationDuration: `${projectile.durationMs}ms`,
        left: `${projectile.startXPercent}%`,
        top: `${projectile.startYPercent}%`,
      }}
      data-letter-projectile={projectile.id}
      onAnimationEnd={() => onComplete(projectile.id)}
      aria-hidden="true"
    >
      {projectile.letter}
    </span>
  );
}

interface LetterProjectileProps {
  readonly projectile: LetterProjectileSpec;
  readonly onComplete: (projectileId: string) => void;
  readonly onCrossPlayerLane: (projectileId: string, impactXPercent: number) => void;
}
