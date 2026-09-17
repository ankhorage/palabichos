import type { HorizontalBounds } from '../../../../types/gameplay';

/*** Return whether a rendered projectile horizontally overlaps the rendered player hitbox. */
export function isProjectilePlayerCollision(
  projectileBounds: HorizontalBounds,
  playerBounds: HorizontalBounds,
) {
  return projectileBounds.right >= playerBounds.left && projectileBounds.left <= playerBounds.right;
}
