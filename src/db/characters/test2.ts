import { BattleActions } from 'controller/battle-actions';
import { battleStatsCreate } from 'model/battle';
import {
  AnimationState,
  Facing,
  CharacterTemplate,
  WeaponEquipState,
} from 'model/character';

export const init = () => {
  const exp = {} as { [key: string]: CharacterTemplate };

  exp.TestDialogA = {
    name: 'TestDialogA',
    spriteBase: 'guy2',
    facing: Facing.RIGHT_DOWN,
    animationState: AnimationState.IDLE,
    talkTrigger: 'test-testDialogA',
  };

  exp.TestDialogB = {
    name: 'TestDialogB',
    spriteBase: 'girl2',
    facing: Facing.RIGHT_DOWN,
    animationState: AnimationState.IDLE,
    talkTrigger: 'test-testDialogB',
  };

  exp.TestDialogC = {
    name: 'TestDialogC',
    spriteBase: 'girl3',
    facing: Facing.RIGHT_DOWN,
    animationState: AnimationState.IDLE,
    talkTrigger: 'test-testDialogC',
  };

  exp.TestDialogD = {
    name: 'TestDialogD',
    spriteBase: 'girl',
    facing: Facing.DOWN,
    animationState: AnimationState.IDLE,
    talkTrigger: 'test-testDialogD',
  };

  exp.TestDialogE = {
    name: 'TestDialogE',
    spriteBase: 'girl',
    facing: Facing.LEFT_DOWN,
    animationState: AnimationState.IDLE,
    talkTrigger: 'test-testDialogE',
  };

  exp.Shopkeep = {
    name: 'Shopkeep',
    spriteBase: 'employee-guy',
    facing: Facing.LEFT_DOWN,
    animationState: AnimationState.IDLE,
    talkTrigger: 'test-ada-sigma-shopkeep',
  };

  return exp;
};
