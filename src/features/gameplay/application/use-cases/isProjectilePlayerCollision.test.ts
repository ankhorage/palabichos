import { describe, expect, test } from 'bun:test';

import { isProjectilePlayerCollision } from './isProjectilePlayerCollision';

describe('isProjectilePlayerCollision', () => {
  test('treats left and right misses symmetrically', () => {
    const playerBounds = { left: 100, right: 140 };

    expect(isProjectilePlayerCollision({ left: 70, right: 99.9 }, playerBounds)).toBe(false);
    expect(isProjectilePlayerCollision({ left: 140.1, right: 170 }, playerBounds)).toBe(false);
  });

  test('counts edge contact and overlap as collisions', () => {
    const playerBounds = { left: 100, right: 140 };

    expect(isProjectilePlayerCollision({ left: 80, right: 100 }, playerBounds)).toBe(true);
    expect(isProjectilePlayerCollision({ left: 140, right: 160 }, playerBounds)).toBe(true);
    expect(isProjectilePlayerCollision({ left: 112, right: 124 }, playerBounds)).toBe(true);
  });
});
