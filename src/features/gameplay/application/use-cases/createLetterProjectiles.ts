import type { CreatureViewModel, LetterProjectileSpec } from '../../../../types/gameplay';

/*** Split one destroyed word into deterministic readable letter projectile specifications. */
export function createLetterProjectiles(
  creature: CreatureViewModel,
  sequence: number,
): readonly LetterProjectileSpec[] {
  const letters = Array.from(creature.word.text);
  const centerOffset = (letters.length - 1) / 2;

  return letters.map((letter, index) => {
    const trajectory = trajectoryForIndex(index);
    const startXPercent = clampPercent(creature.xPercent + (index - centerOffset) * 2.2);
    const durationMs = 3400 + (index % 3) * 260;
    const delayMs = index * 70;
    const impactProgress = Math.min(
      0.82,
      Math.max(0.16, (PLAYER_LANE_Y_PERCENT - creature.yPercent) / FALL_DISTANCE_PERCENT),
    );

    return {
      id: `${sequence}-${index}`,
      letter,
      startXPercent,
      startYPercent: creature.yPercent,
      trajectory,
      durationMs,
      delayMs,
      impactXPercent: clampPercent(startXPercent + trajectoryDriftPercent(trajectory)),
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

/*** Convert one visual trajectory into its approximate player-lane horizontal drift. */
function trajectoryDriftPercent(trajectory: LetterProjectileSpec['trajectory']) {
  switch (trajectory) {
    case 'far-left':
      return -14;
    case 'left':
      return -7;
    case 'right':
      return 7;
    case 'far-right':
      return 14;
    default:
      return 0;
  }
}

/*** Clamp a normalized playfield percentage to a visible horizontal projectile range. */
function clampPercent(value: number) {
  return Math.min(94, Math.max(6, value));
}

const PLAYER_LANE_Y_PERCENT = 86;
const FALL_DISTANCE_PERCENT = 110;
