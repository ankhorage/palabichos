import type {
  CreatureViewModel,
  GameplayConfig,
  LetterProjectileSpec,
} from '../../../../types/gameplay';

/*** Split one destroyed word translation into deterministic configured letter projectiles. */
export function createLetterProjectiles(
  creature: CreatureViewModel,
  sequence: number,
  config: GameplayConfig,
): readonly LetterProjectileSpec[] {
  const letters = Array.from(creature.word.translation);
  const centerOffset = (letters.length - 1) / 2;

  return letters.map((letter, index) => {
    const driftPercent = driftPercentForIndex(index, config);
    const startXPercent = clampPercent(
      creature.xPercent + (index - centerOffset) * config.projectileLetterSpacingPercent,
      config,
    );
    const durationMs =
      config.projectileBaseDurationMs + (index % 3) * config.projectileDurationStepMs;
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
      driftPercent,
      fallDistancePercent: config.projectileFallDistancePercent,
      durationMs,
      delayMs,
      impactXPercent: clampPercent(startXPercent + driftPercent, config),
      impactDelayMs: delayMs + Math.round(durationMs * impactProgress),
    };
  });
}

/*** Select one of five configured horizontal drifts for a letter position. */
function driftPercentForIndex(index: number, config: GameplayConfig) {
  switch (index % 5) {
    case 0:
      return -config.projectileFarDriftPercent;
    case 1:
      return -config.projectileNearDriftPercent;
    case 3:
      return config.projectileNearDriftPercent;
    case 4:
      return config.projectileFarDriftPercent;
    default:
      return 0;
  }
}

/*** Clamp a normalized playfield percentage to the configured projectile range. */
function clampPercent(value: number, config: GameplayConfig) {
  return Math.min(config.projectileMaxXPercent, Math.max(config.projectileMinXPercent, value));
}
