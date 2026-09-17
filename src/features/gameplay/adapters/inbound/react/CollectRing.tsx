/*** Render the hold-to-collect progress ring around an active word creature. */
export function CollectRing({ active, durationMs }: CollectRingProps) {
  return (
    <svg className="collect-ring" viewBox="0 0 64 64" aria-hidden="true">
      <circle className="collect-ring-track" cx="32" cy="32" r="28" />
      {active ? (
        <circle
          className="collect-ring-progress"
          cx="32"
          cy="32"
          r="28"
          style={{ animationDuration: `${durationMs}ms` }}
        />
      ) : null}
    </svg>
  );
}

interface CollectRingProps {
  readonly active: boolean;
  readonly durationMs: number;
}
