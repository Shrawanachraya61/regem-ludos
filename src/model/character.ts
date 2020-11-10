import { createAnimation, Animation } from 'model/animation';

export enum Facing {
  LEFT = 'left',
  UP = 'up',
  DOWN = 'down',
  LEFT_UP = 'leftup',
  LEFT_DOWN = 'leftdown',
  RIGHT = 'left_f',
  RIGHT_UP = 'leftup_f',
  RIGHT_DOWN = 'leftdown_f',
}

export enum AnimationState {
  IDLE = 'idle',
  WALK = 'walk',
  BATTLE_IDLE = 'battle_idle',
  BATTLE_JUMP = 'battle_jump',
  BATTLE_ATTACK = 'battle_attack',
  BATTLE_DAMAGED = 'battle_damaged',
  BATTLE_FLOURISH = 'battle_flourish',
}

export interface Character {
  name: string;
  spriteBase: string;
  x: number;
  y: number;
  facing: Facing;
  animationState: AnimationState;
  animationKey: string;
  storedAnimations: { [key: string]: Animation };
}

export interface CharacterTemplate {
  name: string;
  spriteBase: string;
  facing?: Facing;
  animationState?: AnimationState;
}

export const characterCreate = (name: string): Character => {
  const ch = {
    name,
    spriteBase: 'ada',
    x: 0,
    y: 0,
    facing: Facing.LEFT,
    animationState: AnimationState.IDLE,
    animationKey: '',
    storedAnimations: {},
  };
  ch.animationKey = characterGetAnimKey(ch);
  return ch;
};

export const characterCreateFromTemplate = (
  template: CharacterTemplate
): Character => {
  const ch = characterCreate(template.name);
  ch.spriteBase = template.spriteBase;
  ch.facing = template.facing || ch.facing;
  ch.animationState = template.animationState || ch.animationState;
  ch.animationKey = characterGetAnimKey(ch);
  return ch;
};

export const characterGetAnimKey = (ch: Character): string => {
  const { spriteBase, facing, animationState } = ch;
  const animStr = `${spriteBase}_${animationState}_${facing}`;
  return animStr;
};

export const characterGetAnimation = (ch: Character): Animation => {
  const { storedAnimations } = ch;
  const animStr = characterGetAnimKey(ch);
  const anim = storedAnimations[animStr];
  if (anim) {
    return anim;
  } else {
    const anim = createAnimation(animStr);
    storedAnimations[animStr] = anim;
    return anim;
  }
};

export const characterSetAnimationState = (
  ch: Character,
  animState: AnimationState
): void => {
  ch.animationState = animState;
  const newAnimKey = characterGetAnimKey(ch);
  if (newAnimKey !== ch.animationKey) {
    const anim = characterGetAnimation(ch);
    anim.reset();
    anim.start();
  }
};

export const characterSetFacing = (ch: Character, facing: Facing): void => {
  ch.facing = facing;
  characterSetAnimationState(ch, ch.animationState);
};
