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

  exp.TutRobotRoamer1 = {
    name: 'TutRobotRoamer1',
    spriteBase: 'tut_robot_roamer',
    facing: Facing.LEFT,
    animationState: AnimationState.IDLE,
    overworldAi: 'ROAM_WALK_RIGHT_LEFT',
    canGetStuckWhileWalking: true,
  };

  return exp;
};
