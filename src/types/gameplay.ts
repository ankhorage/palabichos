type WordCategory = 'animals' | 'food' | 'home' | 'transport';

type CreatureVariant = 'berry' | 'mint' | 'sun' | 'lavender';

type CreatureMotion = 'bob' | 'drift' | 'sway';

type GamePhase = 'playing' | 'level-complete' | 'game-over';

type LetterTrajectory = 'far-left' | 'left' | 'center' | 'right' | 'far-right';

export type CreatureAction = 'collect' | 'shoot';

export type GameplayConfigId = 'starter';

export type PlayerHitPhase = 'idle' | 'hitstop' | 'respawning';

type CreatureActionOutcome = 'collected' | 'destroyed' | 'mistake' | 'ignored';

interface WordEntry {
  readonly id: string;
  readonly text: string;
  readonly translation: string;
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

export interface GameplayConfig {
  readonly collectHoldMs: number;
  readonly pointerCancelDistancePx: number;
  readonly resolutionFeedbackMs: number;
  readonly mistakeVisibleMs: number;
  readonly shotVisibleMs: number;
  readonly startingHealth: number;
  readonly maxHealth: number;
  readonly correctActionsPerExtraLife: number;
  readonly wrongActionDamage: number;
  readonly projectileDamage: number;
  readonly movementZoneStartPercent: number;
  readonly playerMinXPercent: number;
  readonly playerMaxXPercent: number;
  readonly playerStartXPercent: number;
  readonly keyboardStepPercent: number;
  readonly projectileBaseDurationMs: number;
  readonly projectileDurationStepMs: number;
  readonly projectileDelayStepMs: number;
  readonly projectileLetterSpacingPercent: number;
  readonly playerLaneYPercent: number;
  readonly projectileFallDistancePercent: number;
  readonly projectileMinImpactProgress: number;
  readonly projectileMaxImpactProgress: number;
  readonly projectileMinXPercent: number;
  readonly projectileMaxXPercent: number;
  readonly projectileNearDriftPercent: number;
  readonly projectileFarDriftPercent: number;
  readonly playerHitRadiusPercent: number;
  readonly invulnerabilityMs: number;
  readonly levelCompleteVisibleMs: number;
  readonly rewardParticleCount: number;
  readonly hitStopMs: number;
  readonly playerRespawnDelayMs: number;
  readonly playerRespawnBlinkMs: number;
}

export interface LevelDefinition {
  readonly id: string;
  readonly number: number;
  readonly title: string;
  readonly targetCategory: WordCategory;
  readonly targetCount: number;
  readonly gameplayConfigId: GameplayConfigId;
  readonly initialCreatures: readonly CreatureSeed[];
  readonly respawnCreatures: readonly CreatureSeed[];
}

export interface CreatureViewModel extends CreatureSeed {
  readonly matchesTarget: boolean;
}

export interface CreatureResolution {
  readonly id: number;
  readonly creatureId: string;
  readonly action: CreatureAction;
  readonly translation: string;
  readonly matchesTarget: boolean;
  readonly isCorrect: boolean;
}

export interface GameScene {
  readonly level: LevelDefinition;
  readonly gameplayConfig: GameplayConfig;
  readonly levelIndex: number;
  readonly phase: GamePhase;
  readonly collectedCount: number;
  readonly correctStreak: number;
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

export interface LetterProjectileSpec {
  readonly id: string;
  readonly letter: string;
  readonly startXPercent: number;
  readonly startYPercent: number;
  readonly trajectory: LetterTrajectory;
  readonly durationMs: number;
  readonly delayMs: number;
  readonly impactXPercent: number;
  readonly impactDelayMs: number;
}
