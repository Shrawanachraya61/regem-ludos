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
};
