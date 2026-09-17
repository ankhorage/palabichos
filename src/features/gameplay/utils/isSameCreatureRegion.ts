/*** Return whether two creature positions occupy the same broad playfield region. */
export function isSameCreatureRegion(
  first: { readonly xPercent: number; readonly yPercent: number },
  second: { readonly xPercent: number; readonly yPercent: number },
) {
  return (
    first.xPercent < 50 === second.xPercent < 50 && first.yPercent < 45 === second.yPercent < 45
  );
}
