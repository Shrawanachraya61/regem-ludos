interface IAnimationSound {
  soundName: string;
  frame: number;
}

export interface AnimationMetadata {
  loopFromFrame?: number; // if anim set to `loop=true` then the loop resets to this frame instead of 0
  strikeFrame?: number; // frame on which a strike occurs
  sounds?: IAnimationSound[];
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
  exp.ada_battle_attack_left = {
    strikeFrame: 3,
  };
  exp.ada_battle_attack_p_left = {
    strikeFrame: 5,
  };
  exp.conscience_battle_ranged_left = {
    strikeFrame: 5,
  };
  exp.tut_robot_boss_battle_attack_left = {
    strikeFrame: 10,
  };
  exp.tut_robot_boss_battle_attack_k_left = {
    strikeFrame: 6,
  };
  exp.tut_robot_boss_battle_attack_p_left = {
    strikeFrame: 6,
  };
  exp.tut_robot_melee_speedy_battle_attack_left = {
    strikeFrame: 2,
  };
  exp.tut_robot_armored_battle_attack_left = {
    strikeFrame: 2,
  };
  exp.tut_robot_armored_battle_attack_k_left = {
    strikeFrame: 10,
  };
  exp.tut_robot_melee_battle_attack_left = {
    strikeFrame: 3,
  };
};
