type WordCategory = 'animals' | 'food' | 'home' | 'transport';

type CreatureVariant = 'berry' | 'mint' | 'sun' | 'lavender';

type CreatureMotion = 'bob' | 'drift' | 'sway';

export type CreatureAction = 'collect' | 'shoot';

type CreatureActionOutcome = 'collected' | 'destroyed' | 'mistake' | 'ignored';

interface WordEntry {
  readonly id: string;
  readonly text: string;
  readonly categories: readonly WordCategory[];
}

interface CreatureSeed {
  readonly id: string;
  readonly word: WordEntry;
  readonly xPercent: number;
  readonly yPercent: number;
  readonly variant: CreatureVariant;
  readonly motion: CreatureMotion;
  readonly animationDelaySeconds: number;
  readonly animationDurationSeconds: number;
}

export interface LevelDefinition {
  readonly id: string;
  readonly number: number;
  readonly title: string;
  readonly targetCategory: WordCategory;
  readonly targetCount: number;
  readonly initialCreatures: readonly CreatureSeed[];
  readonly respawnCreatures: readonly CreatureSeed[];
}

export interface CreatureViewModel extends CreatureSeed {
  readonly matchesTarget: boolean;
}

export interface GameScene {
  readonly level: LevelDefinition;
  readonly collectedCount: number;
  readonly health: number;
  readonly creatures: readonly CreatureViewModel[];
  readonly spawnSequence: number;
}

export interface CreatureActionResult {
  readonly scene: GameScene;
  readonly outcome: CreatureActionOutcome;
  readonly creatureId: string;
}

export interface ShotViewModel {
  readonly id: number;
  readonly fromXPercent: number;
  readonly toXPercent: number;
  readonly toYPercent: number;
}
