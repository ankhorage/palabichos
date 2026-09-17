import type { CreatureViewModel } from '../../../../types/gameplay';
import type { VocabularyWord } from '../../../../types/vocabulary';

/*** Build deterministic creature presentation independently from vocabulary identity. */
export function createCreatureViewModel(
  word: VocabularyWord,
  sequence: number,
  targetCategoryId: string,
): CreatureViewModel {
  const position = POSITIONS[sequence % POSITIONS.length];
  const variant = VARIANTS[sequence % VARIANTS.length];
  const motion = MOTIONS[sequence % MOTIONS.length];

  if (position === undefined || variant === undefined || motion === undefined) {
    throw new Error('Creature presentation catalogs must not be empty.');
  }

  return {
    id: `creature-${sequence}-${word.id}`,
    word,
    matchesTarget: word.categoryIds.includes(targetCategoryId),
    xPercent: position.xPercent,
    yPercent: position.yPercent,
    variant,
    motion,
    animationDelaySeconds: -((sequence % 7) * 0.55),
    animationDurationSeconds: 5.8 + (sequence % 6) * 0.42,
  };
}

const POSITIONS = [
  { xPercent: 18, yPercent: 25 },
  { xPercent: 57, yPercent: 19 },
  { xPercent: 79, yPercent: 34 },
  { xPercent: 31, yPercent: 49 },
  { xPercent: 68, yPercent: 55 },
  { xPercent: 43, yPercent: 67 },
  { xPercent: 22, yPercent: 31 },
  { xPercent: 72, yPercent: 24 },
  { xPercent: 48, yPercent: 42 },
  { xPercent: 81, yPercent: 52 },
  { xPercent: 29, yPercent: 58 },
  { xPercent: 59, yPercent: 63 },
] as const;

const VARIANTS = ['mint', 'berry', 'sun', 'lavender'] as const;
const MOTIONS = ['bob', 'sway', 'drift'] as const;
