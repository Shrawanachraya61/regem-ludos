import { BattleActions } from 'controller/battle-actions';
import { createWalkerAI } from 'db/overworld-ai';
import { battleStatsCreate } from 'model/battle';
import {
  AnimationState,
  Facing,
  CharacterTemplate,
  WeaponEquipState,
  characterSetFacing,
} from 'model/character';

export const init = () => {
  const exp = {} as { [key: string]: CharacterTemplate };

  exp.Floor1AtriumDeskEmployee = {
    name: 'Atrium Desk Employee',
    spriteBase: 'employee-girl',
    talkTrigger: 'floor1-atrium-desk-employee',
    facing: Facing.RIGHT_UP,
    animationState: AnimationState.IDLE,
  };

  exp.Floor1AtriumElevatorEmployee = {
    name: 'Atrium Elevator Employee',
    spriteBase: 'employee-guy',
    talkTrigger: 'floor1-atrium-elevator-employee',
    facing: Facing.LEFT_DOWN,
    animationState: AnimationState.IDLE,
  };

  exp.Floor1AtriumTicTacToeGirl = {
    name: 'Tic Tac Toe Girl',
    nameLabel: 'Girl',
    spriteBase: 'girl',
    talkTrigger: 'floor1-atrium-TicTacToeGirl',
    facing: Facing.RIGHT_DOWN,
    animationState: AnimationState.IDLE,
  };

  exp.Floor1AtriumEmployeeJason = {
    name: 'Atrium Employee Jason',
    nameLabel: 'Employee Jason',
    spriteBase: 'employee-guy2',
    talkTrigger: 'floor1-atrium-employee-jason',
    facing: Facing.LEFT_DOWN,
    animationState: AnimationState.IDLE,
    speed: 1,
  };

  exp.Floor1PingPongGuyA = {
    name: 'Floor1PingPongGuyA',
    nameLabel: 'Ping Pong Guy',
    spriteBase: 'guy2',
    facing: Facing.LEFT_DOWN,
    animationState: AnimationState.IDLE,
    overrideAnimationName: 'guy2_pingpong_idle',
    talkTrigger: 'floor1-Floor1PingPongGuyA',
    overworldAi: 'PING_PONG',
  };

  exp.Floor1PingPongGuyB = {
    name: 'Floor1PingPongGuyB',
    nameLabel: 'Avid Ping Pong Guy',
    spriteBase: 'guy3',
    facing: Facing.RIGHT_UP,
    animationState: AnimationState.IDLE,
    overrideAnimationName: 'guy3_pingpong_idle',
    talkTrigger: 'floor1-Floor1PingPongGuyA',
    overworldAi: 'PING_PONG',
  };

  exp.Floor1AtriumPingPongSearcher = {
    name: 'Floor1AtriumPingPongSearcher',
    nameLabel: 'Distressed Girl',
    spriteBase: 'girl2',
    facing: Facing.RIGHT_DOWN,
    animationState: AnimationState.IDLE,
    talkTrigger: 'floor1-AtriumPingPongSearcher',
  };

  exp.Floor1AtriumGreeterEmployee = {
    name: 'AtriumGreeterEmployee',
    nameLabel: 'Employee Greeter',
    spriteBase: 'employee-girl',
    talkTrigger: 'floor1-atrium-greeter-employee',
    facing: Facing.LEFT_DOWN,
    animationState: AnimationState.IDLE,
  };

  exp.Floor1BowlingGirl = {
    name: 'Floor1BowlingGirl',
    nameLabel: 'Girl',
    spriteBase: 'girl3',
    talkTrigger: 'floor1-bowling-girl',
    facing: Facing.LEFT_DOWN,
    animationState: AnimationState.IDLE,
    overworldAi: createWalkerAI(['MarkerWalkA', 'MarkerWalkB'], {
      pauseDurationMs: 1000,
      onReachDestination: ch => {
        characterSetFacing(ch, Facing.LEFT_UP);
      },
    }),
  };

  exp.Floor1BowlingEmployee = {
    name: 'Floor1BowlingEmployee',
    nameLabel: 'Bowling Employee',
    spriteBase: 'employee-girl',
    talkTrigger: 'floor1-bowling-employee',
    facing: Facing.LEFT_DOWN,
    animationState: AnimationState.IDLE,
  };
  return exp;
};
