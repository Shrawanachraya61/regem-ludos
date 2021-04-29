import { randInArr } from 'utils';
import { drawParticle, drawRect } from 'view/draw';
import { colors } from 'view/style';
import { getCanvas } from './canvas';
import { getFrameMultiplier } from './generics';
import { Particle, particleCreate, particleUpdate } from './particle';

export class ParticleSystem {
  particles: Particle[] = [];
  width = 0;
  height = 0;
  clearColor = '';
  meta: Record<string, any> = {};
  onParticleUpdate: (p: Particle) => void = () => undefined;

  updateDraw() {
    const canvasOuter = getCanvas('outer');
    const ctx: any = canvasOuter.getContext('2d');

    if (this.clearColor) {
      drawRect(0, 0, this.width, this.height, this.clearColor, false, ctx);
    }

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      this.onParticleUpdate(p);
      particleUpdate(p);
      drawParticle(p, p.x, p.y, 1, ctx);
    }
    ctx.restore();
  }
}

// HACK: This is gonna break if ever the screen is changed from what it is.
export const createBattleTransitionParticleSystem = (screenshot: ImageData) => {
  const canvasOuter = getCanvas('outer');
  const numParticles = 1500;
  const ps = new ParticleSystem();
  const screenWidth = canvasOuter.width;
  const screenHeight = canvasOuter.height;
  ps.width = screenWidth;
  ps.height = screenHeight;
  ps.clearColor = `rgba(0, 0, 0, ${getFrameMultiplier() * 0.05})`;
  for (let i = 0; i < numParticles; i++) {
    const p = particleCreate();
    p.y = (-Math.random() * screenHeight) / 2;
    p.x = Math.random() * screenWidth;
    p.vy = 20 + Math.random() * 1.5;
    p.w = p.h = 15 + Math.random() * 8;
    p.color = randInArr([colors.WHITE, colors.GREY]);
    p.timer.pause();
    p.shape = 'rect';
    ps.particles.push(p);
  }

  return ps;
};
