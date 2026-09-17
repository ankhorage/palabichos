import type { CreatureViewModel } from '../../../../types/gameplay';
import type { VocabularyWord } from '../../../../types/vocabulary';
import { isSameCreatureRegion } from '../../utils/isSameCreatureRegion';

/*** Build creature presentation independently from vocabulary identity and answer correctness. */
export function createCreatureViewModel(
  word: VocabularyWord,
  sequence: number,
  targetCategoryId: string,
  presentationSeed = 0,
  occupiedCreatures: readonly CreatureViewModel[] = [],
  minimumDistancePercent = 0,
  avoidPosition: { readonly xPercent: number; readonly yPercent: number } | null = null,
): CreatureViewModel {
  const position = selectPosition(
    sequence,
    presentationSeed,
    occupiedCreatures,
    minimumDistancePercent,
    avoidPosition,
  );
  const variant = VARIANTS[sequence % VARIANTS.length];
  const motion = MOTIONS[sequence % MOTIONS.length];

  if (variant === undefined || motion === undefined) {
    throw new Error('Creature presentation catalogs must not be empty.');
  }

  return {
    id: `creature-${sequence}-${word.id}`,
    word,
    matchesTarget: word.categoryIds.includes(targetCategoryId),
    spawnSequence: sequence,
    ageInCorrectShots: 0,
    xPercent: position.xPercent,
    yPercent: position.yPercent,
    variant,
    motion,
    animationDelaySeconds: -((sequence % 7) * 0.55),
    animationDurationSeconds: 5.8 + (sequence % 6) * 0.42,
  };
}

/*** Select a deterministic readable slot while preferring a different region from the retired slot. */
function selectPosition(
  sequence: number,
  presentationSeed: number,
  occupiedCreatures: readonly CreatureViewModel[],
  minimumDistancePercent: number,
  avoidPosition: { readonly xPercent: number; readonly yPercent: number } | null,
): CreaturePosition {
  const positionOffset = createPositionOffset(presentationSeed);
  const startIndex = (sequence + positionOffset) % POSITIONS.length;
  const candidates = Array.from(
    { length: POSITIONS.length },
    (_, offset) => POSITIONS[(startIndex + offset) % POSITIONS.length] ?? POSITIONS[0],
  );
  const available = candidates.filter((candidate) =>
    isPositionAvailable(candidate, occupiedCreatures, minimumDistancePercent),
  );
  const position =
    avoidPosition === null
      ? available.at(0)
      : (available.find((candidate) => !isSameCreatureRegion(candidate, avoidPosition)) ??
        available.at(0));

  if (position === undefined) {
    throw new Error('Creature presentation cannot find a readable free position.');
  }

  return position;
}

type CreaturePosition = (typeof POSITIONS)[number];

/*** Return whether one candidate position keeps the configured distance from active creatures. */
function isPositionAvailable(
  position: CreaturePosition,
  occupiedCreatures: readonly CreatureViewModel[],
  minimumDistancePercent: number,
) {
  return occupiedCreatures.every(
    (creature) =>
      Math.hypot(position.xPercent - creature.xPercent, position.yPercent - creature.yPercent) >=
      minimumDistancePercent,
  );
}

/*** Convert one round random seed into a stable presentation-slot offset. */
function createPositionOffset(presentationSeed: number) {
  const normalizedSeed = Math.min(0.999999, Math.max(0, presentationSeed));
  return Math.floor(normalizedSeed * POSITIONS.length);
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
