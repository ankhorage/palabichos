export type WordCategory = 'animals' | 'food' | 'home' | 'transport';

export type CreatureVariant = 'berry' | 'mint' | 'sun' | 'lavender';

export type CreatureMotion = 'bob' | 'drift' | 'sway';

export interface WordEntry {
  readonly id: string;
  readonly text: string;
  readonly categories: readonly WordCategory[];
}

export interface CreatureSeed {
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
}

export interface CreatureViewModel extends CreatureSeed {
  readonly matchesTarget: boolean;
}

export interface GameScene {
  readonly level: LevelDefinition;
  readonly collectedCount: number;
  readonly health: number;
  readonly creatures: readonly CreatureViewModel[];
}
