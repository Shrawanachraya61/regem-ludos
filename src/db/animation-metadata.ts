import { Point } from 'utils';

interface IAnimationSound {
  soundName: string;
  frame: number; // frame on which sound occurs
}

export interface AnimationMetadata {
  loopFromFrame?: number; // if anim set to `loop=true` then the loop resets to this frame instead of 0
  strikeFrame?: number; // frame on which a strike occurs
  sounds?: IAnimationSound[];
  rangedParticleSpawnOffset?: Point;
}

const exp = {} as Record<string, AnimationMetadata>;
export const get = (key: string): AnimationMetadata => {
  const result = exp[key];
  if (!result) {
    throw new Error(`No AnimationMetadata exists with name: ${key}`);
  }
  return {
    ...result,
  };
};

export const getIfExists = (key: string): AnimationMetadata | null => {
  const result = exp[key];
  if (!result) {
    return null;
  }
  return {
    ...result,
  };
};

export const init = () => {
  exp.ada_battle_attack_left_f = {
    strikeFrame: 3,
    sounds: [
      {
        soundName: 'battle_swing1',
        frame: 3,
      },
    ],
  };
  exp.ada_battle_attack_p_left_f = {
    strikeFrame: 5,
    sounds: [
      {
        soundName: 'battle_swing1',
        frame: 5,
      },
    ],
  };
  exp.ada_enter_vr_portal = {
    sounds: [],
  };
  // every grey frame
  for (let i = 13; i <= 27; i += 2) {
    exp?.ada_enter_vr_portal?.sounds?.push({
      soundName: 'vr_portal_beep',
      frame: i,
    });
  }

  exp.conscience_battle_ranged_left_f = {
    strikeFrame: 5,
    rangedParticleSpawnOffset: [0, 0],
    sounds: [
      {
        soundName: 'battle_shoot_arrow',
        frame: 5,
      },
    ],
  };
  exp.tut_robot_boss_battle_attack_left = {
    strikeFrame: 10,
    sounds: [
      {
        soundName: 'robot_staggered_damaged',
        frame: 0,
      },
      {
        soundName: 'robot_clank3',
        frame: 1,
      },
      {
        soundName: 'robot_clank4',
        frame: 1,
      },
      {
        soundName: 'robot_clank2',
        frame: 4,
      },
      {
        soundName: 'woosh_reverse',
        frame: 9,
      },
      {
        soundName: 'battle_swing4',
        frame: 10,
      },
      {
        soundName: 'robot_clank2',
        frame: 12,
      },
      {
        soundName: 'robot_clank4',
        frame: 14,
      },
    ],
  };
  exp.tut_robot_boss_battle_attack_k_left = {
    strikeFrame: 6,
    sounds: [
      {
        soundName: 'robot_staggered_damaged',
        frame: 0,
      },
      {
        soundName: 'robot_clank3',
        frame: 1,
      },
      {
        soundName: 'robot_clank2',
        frame: 4,
      },
      {
        soundName: 'battle_swing3',
        frame: 6,
      },
      {
        soundName: 'robot_clank2',
        frame: 8,
      },
      {
        soundName: 'robot_clank3',
        frame: 10,
      },
    ],
  };
  exp.tut_robot_boss_battle_attack_p_left = {
    strikeFrame: 6,
    sounds: [
      {
        soundName: 'robot_staggered_damaged',
        frame: 1,
      },
      {
        soundName: 'robot_clank',
        frame: 2,
      },
      {
        soundName: 'battle_swing2',
        frame: 6,
      },
      {
        soundName: 'robot_clank3',
        frame: 8,
      },
      {
        soundName: 'robot_clank2',
        frame: 10,
      },
    ],
  };
  exp.tut_robot_melee_speedy_battle_attack_left = {
    strikeFrame: 2,
    sounds: [
      {
        soundName: 'battle_swing1',
        frame: 2,
      },
    ],
  };
  exp.tut_robot_ranged_battle_ranged_left = {
    strikeFrame: 2,
    rangedParticleSpawnOffset: [8, -8],
    sounds: [
      {
        soundName: 'battle_shoot_arrow',
        frame: 0,
      },
    ],
  };
  exp.tut_robot_armored_battle_attack_left = {
    strikeFrame: 2,
    sounds: [
      {
        soundName: 'battle_swing1',
        frame: 2,
      },
    ],
  };
  exp.tut_robot_armored_battle_attack_k_left = {
    strikeFrame: 10,
    sounds: [
      {
        soundName: 'battle_robot_charge_up',
        frame: 2,
      },
      {
        soundName: 'battle_swing3',
        frame: 8,
      },
    ],
  };
  exp.tut_robot_melee_battle_attack_left = {
    strikeFrame: 3,
    sounds: [
      {
        soundName: 'battle_swing1',
        frame: 3,
      },
    ],
  };
  exp.tile_vr_portal_active = {
    loopFromFrame: 5,
    sounds: [
      {
        soundName: 'vr_portal_activate',
        frame: 0,
      },
    ],
  };
  exp.tile_vr_portal_passive = {
    loopFromFrame: 5,
    sounds: [
      {
        soundName: 'vr_portal_deactivate',
        frame: 0,
      },
    ],
  };
  exp.tile_save_point_active = {
    loopFromFrame: 6,
    sounds: [
      {
        soundName: 'vr_portal_activate',
        frame: 0,
      },
    ],
  };
  exp.tile_save_point_passive = {
    loopFromFrame: 6,
    sounds: [
      {
        soundName: 'vr_portal_deactivate',
        frame: 0,
      },
    ],
  };

  exp.tile_floor_flicker = {
    sounds: [
      {
        soundName: 'zap_quiet',
        frame: 0,
      },
    ],
  };
};
