import {
  Timer,
  Transform,
  TransformEase,
  transformOffsetWeightedParticle,
} from 'model/utility';
import { Animation, createAnimation } from 'model/animation';
import { Point, truncatePoint3d, getRandBetween } from 'utils';
import { SpriteModification } from './sprite';
import { DrawTextParams, DEFAULT_TEXT_PARAMS, measureText } from 'view/draw';
import { TILE_HEIGHT, TILE_WIDTH } from './room';
import { getFrameMultiplier } from './generics';

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
  vx: number;
  vy: number;
  w: number;
  h: number;
  useOuterCanvas: boolean;
  color?: string;
  shape?: 'rect' | 'circle';
  meta: Record<string, any>;
}

export interface ParticleTemplate {
  animName?: string;
  duration?: number;
  flipped?: boolean;
  opacity?: number;
  scale?: number;
  transform?: Transform;
  offset?: Point;
  text?: string;
  textParams?: DrawTextParams;
  useOuterCanvas?: boolean;
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

export const EFFECT_TEMPLATE_RANGED_LEFT: ParticleTemplate = {
  animName: 'effect_range_projectile_left',
  duration: 300,
};

export const EFFECT_TEMPLATE_RANGED_HIT: ParticleTemplate = {
  animName: 'effect_range_hit_left',
};

export const EFFECT_TEMPLATE_GEM: ParticleTemplate = {
  animName: 'effect_gem',
};

export const EFFECT_TEMPLATE_TREASURE: ParticleTemplate = {
  animName: 'effect_treasure_anim',
};

export const EFFECT_TEMPLATE_AGGROED: ParticleTemplate = {
  animName: 'effect_aggro',
  duration: 500,
  offset: [0, -32],
};

export const EFFECT_TEMPLATE_DEAD32: ParticleTemplate = {
  animName: 'effect_dead2_anim',
  // aligns the sprite to the bottom of feet for 32x32 px sprites
  offset: [0, -12.5],
  opacity: 0.65,
  duration: 2320,
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
  const particle = particleCreate();
  particle.anim = undefined;
  particle.text = text;
  particle.textParams = textParams;
  particle.timer = new Timer(duration);
  particle.transform = new Transform(
    [x, y, 0],
    [x + getRandBetween(-TILE_WIDTH / 2, TILE_WIDTH / 2), y - TILE_HEIGHT, 0],
    duration,
    TransformEase.EASE_OUT
  );
  particle.x = x;
  particle.y = y;
  particle.timer.start();
  return particle;
};

export const createRiseParticle = (
  template: ParticleTemplate,
  x: number,
  y: number,
  durationMs?: number
): Particle => {
  const duration = durationMs ?? 1000;
  const particle = particleCreateFromTemplate([x, y], template);
  particle.transform = new Transform(
    [particle.x, particle.y, 0],
    [particle.x, particle.y - TILE_HEIGHT, 0],
    duration,
    TransformEase.EASE_OUT
  );
  particle.timer.start(duration);
  return particle;
};

// creates a particle that appears to fly up, then land on the ground.
export const createWeightedParticle = (
  template: ParticleTemplate,
  x: number,
  y: number,
  durationMs?: number
): Particle => {
  const duration = durationMs ?? 1000;
  const particle = particleCreateFromTemplate([x, y], template);
  particle.transform = new Transform(
    [particle.x, particle.y, 0],
    [particle.x + getRandBetween(-TILE_WIDTH, TILE_WIDTH), particle.y, 0],
    duration,
    TransformEase.EASE_OUT,
    transformOffsetWeightedParticle
  );
  particle.timer.start(duration);
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
  const particle = particleCreate();
  particle.anim = undefined;
  particle.text = text;
  particle.textParams = textParams;
  particle.timer = new Timer(duration);
  particle.transform = new Transform(
    [x, y, 0],
    [x, y - TILE_HEIGHT, 0],
    duration,
    TransformEase.EASE_OUT
  );
  particle.x = x;
  particle.y = y;
  particle.timer.start();
  return particle;
};

export const particleCreate = (): Particle => {
  const particle: Particle = {
    timer: new Timer(1000),
    shouldRemove: false,
    opacity: 1,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    w: 0,
    h: 0,
    scale: 1,
    meta: {},
    useOuterCanvas: false,
  };
  return particle;
};

export const particleCreateFromTemplate = (
  point: Point,
  template: ParticleTemplate
): Particle => {
  const anim = template.animName
    ? createAnimation(
        template.animName +
          (template.flipped
            ? SpriteModification.FLIPPED
            : SpriteModification.NORMAL)
      )
    : undefined;
  let [w, h] = anim?.getSpriteSize(1) ?? [1, 1];
  const scale = template.scale ?? 1;
  w = w * scale;
  h = h * scale;

  const particle = particleCreate();
  particle.anim = anim;
  particle.timer = new Timer(
    template.duration ?? anim?.getDurationMs() ?? 1000
  );
  particle.opacity = template.opacity ?? 1;
  particle.x = point[0] - w / 2 + (template.offset?.[0] ?? 0);
  particle.y = point[1] - h / 2 + (template.offset?.[1] ?? 0);
  particle.scale = template.scale ?? 1;
  particle.text = template.text ?? '';
  particle.useOuterCanvas = template.useOuterCanvas ?? false;
  particle.textParams = template.textParams ?? DEFAULT_TEXT_PARAMS;

  anim?.start();
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
  const mult = getFrameMultiplier();
  particle.x += particle.vx * mult;
  particle.y += particle.vy * mult;
  if (particle.timer.isComplete()) {
    particle.shouldRemove = true;
  }
};
