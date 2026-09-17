import { type CSSProperties, useEffect } from 'react';

import type { LetterProjectileSpec } from '../../../../../types/gameplay';

/*** Render one configured falling letter and report when it crosses the player lane. */
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

  const style: ProjectileStyle = {
    '--projectile-drift': `${projectile.driftPercent}vw`,
    '--projectile-fall-distance': `${projectile.fallDistancePercent}dvh`,
    animationDelay: `${projectile.delayMs}ms`,
    animationDuration: `${projectile.durationMs}ms`,
    left: `${projectile.startXPercent}%`,
    top: `${projectile.startYPercent}%`,
  };

  return (
    <span
      className="letter-projectile"
      style={style}
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

interface ProjectileStyle extends CSSProperties {
  readonly '--projectile-drift': string;
  readonly '--projectile-fall-distance': string;
}
