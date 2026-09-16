import type { CreatureResolution } from '../../../../../types/gameplay';

/*** Render the Spanish word or its temporary German semantic resolution. */
export function WordCreatureLabel({ resolution, text }: WordCreatureLabelProps) {
  if (resolution === null) {
    return <span className="word-label">{text}</span>;
  }

  return (
    <span className="word-label word-label--resolution">
      {resolution.translation}
      <span className="resolution-marker" aria-hidden="true">
        {resolution.matchesTarget ? '✅' : '❌'}
      </span>
    </span>
  );
}

interface WordCreatureLabelProps {
  readonly resolution: CreatureResolution | null;
  readonly text: string;
}
