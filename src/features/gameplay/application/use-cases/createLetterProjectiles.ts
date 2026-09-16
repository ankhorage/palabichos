import type { CreatureViewModel, LetterProjectileSpec } from '../../../../types/gameplay';

/*** Split one destroyed word into deterministic readable letter projectile specifications. */
export function createLetterProjectiles(
  creature: CreatureViewModel,
  sequence: number,
): readonly LetterProjectileSpec[] {
  const letters = Array.from(creature.word.text);
  const centerOffset = (letters.length - 1) / 2;

  return letters.map((letter, index) => ({
    id: `${sequence}-${index}`,
    letter,
    startXPercent: Math.min(94, Math.max(6, creature.xPercent + (index - centerOffset) * 2.2)),
    startYPercent: creature.yPercent,
    trajectory: trajectoryForIndex(index),
    durationMs: 3400 + (index % 3) * 260,
    delayMs: index * 70,
  }));
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
