import type { LetterProjectileSpec } from '../../../../../types/gameplay';

/*** Render one falling letter projectile from a destroyed word. */
export function LetterProjectile({ projectile, onComplete }: LetterProjectileProps) {
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
}
