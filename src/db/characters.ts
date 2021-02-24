import { AnimationState, Facing, CharacterTemplate } from 'model/character';

const exp = {} as { [key: string]: CharacterTemplate };
export const get = (key: string): CharacterTemplate => {
  const result = exp[key];
  if (!result) {
    throw new Error(`No character template exists with name: ${key}`);
  }
  return {
    ...result,
  };
};

export const getIfExists = (key: string): CharacterTemplate | null => {
  const result = exp[key];
  if (!result) {
    return null;
  }
  return {
    ...result,
  };
};

export const init = () => {
  exp.Skye = {
    name: 'Skye',
    spriteBase: 'skye',
    talkTrigger: '',
    facing: Facing.LEFT_UP,
    animationState: AnimationState.IDLE,
  };

  exp.Conscience = {
    name: 'Conscience',
    spriteBase: 'conscience',
    talkTrigger: '',
    facing: Facing.LEFT_UP,
    animationState: AnimationState.IDLE,
  };

  exp.Roger = {
    name: 'Roger',
    spriteBase: 'guy2',
    talkTrigger: 'test-roger',
    facing: Facing.LEFT_DOWN,
    animationState: AnimationState.IDLE,
    tags: ['A'],
    overworldAi: 'WALK_BETWEEN_MARKERS_ABC',
  };

  exp.Rho = {
    name: 'Rho',
    spriteBase: 'rho',
    talkTrigger: 'test-rho',
    facing: Facing.DOWN,
    animationState: AnimationState.IDLE,
  };

  exp.Sigma = {
    name: 'Sigma',
    spriteBase: 'sigma',
    talkTrigger: 'test-sigma',
    facing: Facing.LEFT,
    animationState: AnimationState.IDLE,
  };
};
