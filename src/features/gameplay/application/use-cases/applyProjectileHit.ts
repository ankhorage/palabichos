import type { GameScene } from '../../../../types/gameplay';

/*** Apply one letter-projectile hit while respecting the current invulnerability window. */
export function applyProjectileHit(scene: GameScene, invulnerable: boolean) {
  if (scene.phase !== 'playing' || invulnerable) {
    return { scene, damaged: false };
  }

  const health = Math.max(0, scene.health - 1);

  return {
    scene: {
      ...scene,
      health,
      phase: health === 0 ? 'game-over' : scene.phase,
    },
    damaged: true,
  };
}
