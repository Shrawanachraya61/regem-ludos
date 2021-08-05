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
    duration: 1000,
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
    offset: [8, -12.5],
    opacity: 1,
    duration: 2320,
  };

  const EFFECT_TEMPLATE_PORTAL_SPAWN: ParticleTemplate = {
    animName: 'effect_dead2_anim',
    // aligns the sprite to the bottom of feet for 32x32 px sprites
    offset: [3, -12.5],
    opacity: 1,
    duration: 2320,
  };

  const EFFECT_TEMPLATE_RING: ParticleTemplate = {
    duration: 1000,
    text: 'RING!',
    useOuterCanvas: true,
    offset: [0, 8],
    textParams: {
      size: 32,
      color: colors.YELLOW,
      align: 'center',
      strokeColor: colors.WHITE,
    },
  };

  const EFFECT_TEMPLATE_GIGGLE: ParticleTemplate = {
    duration: 750,
    text: 'Ha',
    useOuterCanvas: true,
    offset: [0, -16],
    textParams: {
      size: 24,
      color: colors.WHITE,
      align: 'center',
      strokeColor: colors.BLACK,
    },
  };

  const EFFECT_TEMPLATE_SIGH: ParticleTemplate = {
    duration: 1500,
    text: '*Sigh*',
    useOuterCanvas: true,
    offset: [4, -16],
    textParams: {
      size: 24,
      color: colors.WHITE,
      align: 'center',
      strokeColor: colors.BLACK,
    },
  };
  const EFFECT_TEMPLATE_SHRUG: ParticleTemplate = {
    duration: 1250,
    text: '*Shrug*',
    useOuterCanvas: true,
    offset: [4, -16],
    textParams: {
      size: 24,
      color: colors.WHITE,
      align: 'center',
      strokeColor: colors.BLACK,
    },
  };

  const EFFECT_TEMPLATE_VR_PORTAL: ParticleTemplate = {
    animName: 'effect_vr_anim',
    duration: 5000,
    scale: 4,
    offset: [0, -32],
  };

  const EFFECT_TEMPLATE_SPAWN: ParticleTemplate = {
    animName: 'effect_spawn',
    duration: 1000,
    // offset: [0, -32],
  };

  const EFFECT_TEMPLATE_PING_PONG_LTR: ParticleTemplate = {
    animName: 'effect_pingpong_ltr',
  };

  const EFFECT_TEMPLATE_PING_PONG_RTL: ParticleTemplate = {
    animName: 'effect_pingpong_rtl',
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
    EFFECT_TEMPLATE_GIGGLE,
    EFFECT_TEMPLATE_SHRUG,
    EFFECT_TEMPLATE_SIGH,
    EFFECT_TEMPLATE_VR_PORTAL,
    EFFECT_TEMPLATE_PORTAL_SPAWN,
    EFFECT_TEMPLATE_SPAWN,
    EFFECT_TEMPLATE_PING_PONG_LTR,
    EFFECT_TEMPLATE_PING_PONG_RTL,
  });
};
