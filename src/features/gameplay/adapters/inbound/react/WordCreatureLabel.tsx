import type { CreatureResolution } from '../../../../../types/gameplay';

/*** Render the Spanish word or its temporary German action-based resolution feedback. */
export function WordCreatureLabel({
  resolution,
  rewardParticleCount,
  text,
}: WordCreatureLabelProps) {
  if (resolution === null) {
    return <span className="word-label">{text}</span>;
  }

  return (
    <span className="word-label word-label--resolution">
      <span>{resolution.translation}</span>
      {resolution.isCorrect ? (
        <span className="resolution-reward" aria-hidden="true">
          <span className="resolution-crystal">◆</span>
          <span className="reward-sparkles">{'✦'.repeat(rewardParticleCount)}</span>
        </span>
      ) : null}
    </span>
  );
}

interface WordCreatureLabelProps {
  readonly resolution: CreatureResolution | null;
  readonly rewardParticleCount: number;
  readonly text: string;
}
