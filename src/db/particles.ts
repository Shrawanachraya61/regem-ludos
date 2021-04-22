import { ParticleTemplate } from 'model/particle';
import { colors } from 'view/style';

const exp = {} as { [key: string]: ParticleTemplate };
export const get = (key: string) => {
  const result = exp[key];
  if (!result) {
    throw new Error(`No particle exists with name: ${key}`);
  }
  return result;
};

export const getIfExists = (key: string): ParticleTemplate | null => {
  const result = exp[key];
  if (!result) {
    return null;
  }
  return {
    ...result,
  };
};

export const init = () => {
  const EFFECT_TEMPLATE_SWORD_LEFT: ParticleTemplate = {
    animName: 'effect_sword_left',
  };

  const EFFECT_TEMPLATE_PIERCE_LEFT: ParticleTemplate = {
    animName: 'effect_pierce_left',
  };

  const EFFECT_TEMPLATE_FIREBALL: ParticleTemplate = {
    animName: 'effect_fireball_explosion_anim',
    opacity: 0.65,
  };

  const EFFECT_TEMPLATE_SMOKE: ParticleTemplate = {
    animName: 'effect_smoke_anim',
  };

  const EFFECT_TEMPLATE_ARMOR_REDUCED: ParticleTemplate = {
    animName: 'effect_armor_shatter',
    scale: 0.5,
  };

  const EFFECT_TEMPLATE_RANGED_LEFT: ParticleTemplate = {
    animName: 'effect_range_projectile_left',
    duration: 300,
  };

  const EFFECT_TEMPLATE_RANGED_HIT: ParticleTemplate = {
    animName: 'effect_range_hit_left',
  };

  const EFFECT_TEMPLATE_GEM: ParticleTemplate = {
    animName: 'effect_gem',
  };

  const EFFECT_TEMPLATE_TREASURE: ParticleTemplate = {
    animName: 'effect_treasure_anim',
  };

  const EFFECT_TEMPLATE_AGGROED: ParticleTemplate = {
    animName: 'effect_aggro',
    duration: 500,
    offset: [0, -32],
  };

  const EFFECT_TEMPLATE_DEAD32: ParticleTemplate = {
    animName: 'effect_dead2_anim',
    // aligns the sprite to the bottom of feet for 32x32 px sprites
    offset: [0, -12.5],
    opacity: 0.65,
    duration: 2320,
  };

  const EFFECT_TEMPLATE_RING: ParticleTemplate = {
    duration: 2000,
    text: 'RING!',
    useOuterCanvas: true,
    offset: [0, 8],
    textParams: {
      size: 32,
      color: colors.YELLOW,
      align: 'center',
    },
  };

  Object.assign(exp, {
    EFFECT_TEMPLATE_SWORD_LEFT,
    EFFECT_TEMPLATE_PIERCE_LEFT,
    EFFECT_TEMPLATE_FIREBALL,
    EFFECT_TEMPLATE_SMOKE,
    EFFECT_TEMPLATE_ARMOR_REDUCED,
    EFFECT_TEMPLATE_RANGED_LEFT,
    EFFECT_TEMPLATE_RANGED_HIT,
    EFFECT_TEMPLATE_GEM,
    EFFECT_TEMPLATE_TREASURE,
    EFFECT_TEMPLATE_AGGROED,
    EFFECT_TEMPLATE_DEAD32,
    EFFECT_TEMPLATE_RING,
  });
};
