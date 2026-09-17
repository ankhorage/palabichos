import { type CSSProperties, useEffect, useRef } from 'react';

import type { HorizontalBounds, LetterProjectileSpec } from '../../../../../types/gameplay';

/*** Render one configured falling letter and report its rendered bounds at the player lane. */
export function LetterProjectile({
  impacting,
  onComplete,
  onCrossPlayerLane,
  projectile,
}: LetterProjectileProps) {
  const elementRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      const element = elementRef.current;
      if (element === null) return;
      const bounds = element.getBoundingClientRect();
      onCrossPlayerLane(projectile.id, { left: bounds.left, right: bounds.right });
    }, projectile.impactDelayMs);
    return () => window.clearTimeout(timerId);
  }, [onCrossPlayerLane, projectile.id, projectile.impactDelayMs]);

  const style: ProjectileStyle = {
    '--projectile-impact-x': `${projectile.impactXPercent}%`,
    '--projectile-end-y': `${projectile.startYPercent + projectile.fallDistancePercent}%`,
    animationDelay: `${projectile.delayMs}ms`,
    animationDuration: `${projectile.durationMs}ms`,
    left: `${projectile.startXPercent}%`,
    top: `${projectile.startYPercent}%`,
  };

  return (
    <span
      ref={elementRef}
      className={impacting ? 'letter-projectile letter-projectile--impact' : 'letter-projectile'}
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
  readonly impacting: boolean;
  readonly projectile: LetterProjectileSpec;
  readonly onComplete: (projectileId: string) => void;
  readonly onCrossPlayerLane: (projectileId: string, projectileBounds: HorizontalBounds) => void;
}

interface ProjectileStyle extends CSSProperties {
  readonly '--projectile-impact-x': string;
  readonly '--projectile-end-y': string;
}
