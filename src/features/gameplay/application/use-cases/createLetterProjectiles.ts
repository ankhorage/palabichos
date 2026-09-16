import type {
  CreatureViewModel,
  GameplayConfig,
  LetterProjectileSpec,
} from '../../../../types/gameplay';

/*** Split one destroyed word translation into deterministic readable letter projectile specifications. */
export function createLetterProjectiles(
  creature: CreatureViewModel,
  sequence: number,
  config: GameplayConfig,
): readonly LetterProjectileSpec[] {
  const letters = Array.from(creature.word.translation);
  const centerOffset = (letters.length - 1) / 2;

  return letters.map((letter, index) => {
    const trajectory = trajectoryForIndex(index);
    const startXPercent = clampPercent(
      creature.xPercent + (index - centerOffset) * config.projectileLetterSpacingPercent,
      config,
    );
    const durationMs = config.projectileBaseDurationMs + (index % 3) * config.projectileDurationStepMs;
    const delayMs = index * config.projectileDelayStepMs;
    const impactProgress = Math.min(
      config.projectileMaxImpactProgress,
      Math.max(
        config.projectileMinImpactProgress,
        (config.playerLaneYPercent - creature.yPercent) / config.projectileFallDistancePercent,
      ),
    );

    return {
      id: `${sequence}-${index}`,
      letter,
      startXPercent,
      startYPercent: creature.yPercent,
      trajectory,
      durationMs,
      delayMs,
      impactXPercent: clampPercent(
        startXPercent + trajectoryDriftPercent(trajectory, config),
        config,
      ),
      impactDelayMs: delayMs + Math.round(durationMs * impactProgress),
    };
  });
}

/*** Map a letter position to one of five calm horizontal fall trajectories. */
function trajectoryForIndex(index: number): LetterProjectileSpec['trajectory'] {
  switch (index % 5) {
    case 0:
      return 'far-left';
    case 1:
      return 'left';
    case 3:
      return 'right';
    case 4:
      return 'far-right';
    default:
      return 'center';
  }
}

/*** Convert one visual trajectory into its configured player-lane horizontal drift. */
function trajectoryDriftPercent(
  trajectory: LetterProjectileSpec['trajectory'],
  config: GameplayConfig,
) {
  switch (trajectory) {
    case 'far-left':
      return -config.projectileFarDriftPercent;
    case 'left':
      return -config.projectileNearDriftPercent;
    case 'right':
      return config.projectileNearDriftPercent;
    case 'far-right':
      return config.projectileFarDriftPercent;
    default:
      return 0;
  }
}

/*** Clamp a normalized playfield percentage to the configured projectile range. */
function clampPercent(value: number, config: GameplayConfig) {
  return Math.min(config.projectileMaxXPercent, Math.max(config.projectileMinXPercent, value));
}
