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
    // canGetStuckWhileWalking: true,
  };

  exp.TutRobotRoamer2 = {
    name: 'TutRobotRoamer1',
    spriteBase: 'guy3',
    facing: Facing.LEFT,
    animationState: AnimationState.IDLE,
    overworldAi: 'ROAM_WALK_RIGHT_LEFT',
    // canGetStuckWhileWalking: true,
  };

  exp.TutRobotDummy0 = {
    name: 'TutRobotDummy1',
    spriteBase: 'tut_robot_roamer',
    facing: Facing.LEFT_DOWN,
    animationState: AnimationState.IDLE,
  };
  exp.TutRobotDummy1 = {
    name: 'TutRobotDummy1',
    spriteBase: 'tut_robot_roamer',
    facing: Facing.LEFT_DOWN,
    animationState: AnimationState.WALK,
  };
  exp.TutRobotDummy2 = {
    name: 'TutRobotDummy2',
    spriteBase: 'tut_robot_roamer',
    facing: Facing.RIGHT_UP,
    animationState: AnimationState.WALK,
  };
  exp.TutRobotDummy3 = {
    name: 'TutRobotDummy3',
    spriteBase: 'tut_robot_roamer',
    facing: Facing.UP,
    animationState: AnimationState.WALK,
  };
  exp.TutRobotDummy4 = {
    name: 'TutRobotDummy4',
    spriteBase: 'tut_robot_roamer',
    facing: Facing.DOWN,
    animationState: AnimationState.WALK,
  };

  return exp;
};
