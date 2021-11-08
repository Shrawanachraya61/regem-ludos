import { BattleActions } from 'controller/battle-actions';
import { battleStatsCreate } from 'model/battle';
import {
  AnimationState,
  Facing,
  CharacterTemplate,
  WeaponEquipState,
} from 'model/character';

import { init as initParty } from './party';
import { init as initTutorial } from './tutorial-roamers';
import { init as initTest } from './test2';
import { init as initFloor1 } from './floor1';

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
  Object.assign(exp, initParty());
  Object.assign(exp, initTest());
  Object.assign(exp, initTutorial());
  Object.assign(exp, initFloor1());

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
    collisionSize: 8,
  };

  exp.Sigma = {
    name: 'Sigma',
    spriteBase: 'sigma',
    talkTrigger: 'test-sigma',
    facing: Facing.RIGHT_DOWN,
    animationState: AnimationState.IDLE,
  };

  for (const i in exp) {
    if (exp[i].name === '') {
      exp[i].name = i;
    }
  }
};
