import { Timer, Transform, TransformEase } from 'model/utility';
import { Animation, createAnimation } from 'model/animation';
import { Point, truncatePoint3d, getRandBetween } from 'utils';
import { SpriteModification } from './sprite';
import { DrawTextParams, measureText } from 'view/draw';
import { TILE_HEIGHT, TILE_WIDTH } from './room';

export interface Particle {
  anim?: Animation;
  text?: string;
  textParams?: DrawTextParams;
  timer: Timer;
  shouldRemove: boolean;
  transform?: Transform;
  opacity?: number;
  scale: number;
  x: number;
  y: number;
}

export interface ParticleTemplate {
  animName?: string;
  duration?: number;
  flipped?: boolean;
  opacity?: number;
  scale?: number;
}

export const EFFECT_TEMPLATE_SWORD_LEFT: ParticleTemplate = {
  animName: 'effect_sword_left',
};

export const EFFECT_TEMPLATE_PIERCE_LEFT: ParticleTemplate = {
  animName: 'effect_pierce_left',
};

export const EFFECT_TEMPLATE_FIREBALL: ParticleTemplate = {
  animName: 'effect_fireball_explosion_anim',
  opacity: 0.65,
};

export const EFFECT_TEMPLATE_SMOKE: ParticleTemplate = {
  animName: 'effect_smoke_anim',
};

export const EFFECT_TEMPLATE_ARMOR_REDUCED: ParticleTemplate = {
  animName: 'effect_armor_shatter',
  scale: 0.5,
};

export const createDamageParticle = (
  text: string,
  x: number,
  y: number,
  color?: string
): Particle => {
  const duration = 1000;
  const textParams: DrawTextParams = {
    size: 16,
    color: color ?? 'white',
    align: 'center',
    strokeColor: 'black',
  };
  const particle: Particle = {
    anim: undefined,
    text,
    textParams,
    timer: new Timer(duration),
    shouldRemove: false,
    transform: new Transform(
      [x, y, 0],
      [x + getRandBetween(-TILE_WIDTH / 2, TILE_WIDTH / 2), y - TILE_HEIGHT, 0],
      duration,
      TransformEase.EASE_OUT
    ),
    scale: 1,
    x,
    y,
  };
  particle.timer.start();
  return particle;
};

export const createStatusParticle = (
  text: string,
  x: number,
  y: number,
  color?: string
): Particle => {
  const duration = 1500;
  const textParams: DrawTextParams = {
    size: 16,
    color: color ?? 'white',
    align: 'center',
    strokeColor: 'black',
  };
  // const [w, h] = measureText(text, textParams);
  // const xPx = x - w / 2;
  // const yPx = y - h / 2;
  const particle: Particle = {
    anim: undefined,
    text,
    textParams,
    timer: new Timer(duration),
    shouldRemove: false,
    transform: new Transform(
      [x, y, 0],
      [x, y - TILE_HEIGHT, 0],
      duration,
      TransformEase.EASE_OUT
    ),
    scale: 1,
    x,
    y,
  };
  particle.timer.start();
  return particle;
};

export const particleCreateFromTemplate = (
  point: Point,
  template: ParticleTemplate
): Particle => {
  const anim = createAnimation(
    template.animName +
      (template.flipped
        ? SpriteModification.FLIPPED
        : SpriteModification.NORMAL)
  );
  const [w, h] = anim.getSpriteSize(1);
  const particle = {
    anim,
    timer: new Timer(template.duration ?? anim.getDurationMs()),
    shouldRemove: false,
    opacity: template.opacity ?? 1,
    x: point[0] - w / 2,
    y: point[1] - h / 2,
    scale: template.scale ?? 1,
  };

  anim.start();
  particle.timer.start();

  return particle;
};

export const particleGetPos = (particle: Particle): Point => {
  if (particle.transform) {
    return truncatePoint3d(particle.transform.current());
  }
  return [particle.x, particle.y];
};

export const particleGetSize = (particle: Particle): Point => {
  const anim = particle.anim;
  return anim?.getSpriteSize(0) || [0, 0];
};

export const particleUpdate = (particle: Particle): void => {
  if (particle.timer.isComplete()) {
    particle.shouldRemove = true;
  }
};
