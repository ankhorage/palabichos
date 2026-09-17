import type { CreatureViewModel } from '../../../../../types/gameplay';

/*** Render a short neutral puff where one aged distractor leaves the playfield. */
export function DistractorPuff({ creature }: DistractorPuffProps) {
  return (
    <div
      className="distractor-puff"
      style={{ left: `${creature.xPercent}%`, top: `${creature.yPercent}%` }}
      aria-hidden="true"
    >
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}

interface DistractorPuffProps {
  readonly creature: CreatureViewModel;
}
