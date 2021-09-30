import { BattleActions } from 'controller/battle-actions';
import { setAtMarker } from 'controller/scene-commands';
import { createWalkerAI } from 'db/overworld-ai';
import { battleStatsCreate } from 'model/battle';
import {
  AnimationState,
  Facing,
  CharacterTemplate,
  WeaponEquipState,
  characterSetFacing,
} from 'model/character';
import { getCurrentRoom } from 'model/generics';
import { roomRemoveCharacter } from 'model/room';

export const init = () => {
  const exp = {} as { [key: string]: CharacterTemplate };

  exp.Floor1BlueCar = {
    name: 'Floor1BlueCar',
    spriteBase: 'blue_car',
    spriteSize: [96, 96],
    sortOffset: 48,
    facing: Facing.LEFT_UP,
    animationState: AnimationState.IDLE,
    speed: 4,
    overworldAi: createWalkerAI(['MarkerBlueCar1'], {
      pauseDurationMs: 1500,
      onReachDestination: ch => {
        setAtMarker(ch.name, 'MarkerBlueCar2');
      },
    }),
  };

  exp.Floor1GreenCar = {
    name: 'Floor1GreenCar',
    spriteBase: 'green_car',
    spriteSize: [96, 96],
    sortOffset: 48,
    facing: Facing.LEFT_UP,
    animationState: AnimationState.IDLE,
    speed: 5,
    overworldAi: createWalkerAI(['MarkerGreenCar1'], {
      pauseDurationMs: 1000,
      onReachDestination: ch => {
        setAtMarker(ch.name, 'MarkerGreenCar2');
      },
    }),
  };

  exp.Floor1WhiteCar = {
    name: 'Floor1WhiteCar',
    spriteBase: 'white_car',
    spriteSize: [96, 96],
    sortOffset: 48,
    facing: Facing.LEFT_UP,
    animationState: AnimationState.IDLE,
    speed: 5,
    overworldAi: createWalkerAI(['MarkerWhiteCar1'], {
      pauseDurationMs: 1000,
      onReachDestination: ch => {
        roomRemoveCharacter(getCurrentRoom(), ch);
      },
    }),
  };

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

  exp.Floor1AtriumNPC1 = {
    name: 'Floor1AtriumNPC1',
    nameLabel: 'Girl',
    spriteBase: 'girl5',
    talkTrigger: 'floor1-AtriumNPC1NPC2',
    facing: Facing.RIGHT_DOWN,
    animationState: AnimationState.IDLE,
  };
  exp.Floor1AtriumNPC2 = {
    name: 'Floor1AtriumNPC2',
    nameLabel: 'Boy',
    spriteBase: 'guy5',
    talkTrigger: 'floor1-AtriumNPC1NPC2',
    facing: Facing.LEFT_UP,
    animationState: AnimationState.IDLE,
  };
  exp.FloorAtriumWalkingNPC = {
    name: 'FloorAtriumWalkingNPC',
    nameLabel: 'Walking Boy',
    spriteBase: 'guy6',
    talkTrigger: 'floor1-AtriumWalkingNPC',
    facing: Facing.LEFT_UP,
    animationState: AnimationState.IDLE,
    speed: 0.5,
    overworldAi: createWalkerAI(
      ['MarkerNPCWalkA', 'MarkerNPCWalkB', 'MarkerNPCWalkC'],
      {
        pauseDurationMs: 3500,
        onReachDestination: ch => {
          characterSetFacing(ch, Facing.DOWN);
        },
      }
    ),
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

  exp.Floor1PrimaryGuy1 = {
    name: 'Floor1PrimaryGuy1',
    nameLabel: 'Older Gentleman',
    spriteBase: 'guy6',
    talkTrigger: 'Floor1PrimaryGuy1',
    facing: Facing.RIGHT_UP,
    animationState: AnimationState.IDLE,
  };

  exp.Floor1PrimaryGuy2 = {
    name: 'Floor1PrimaryGuy2',
    nameLabel: 'Guy',
    spriteBase: 'guy7',
    talkTrigger: 'Floor1PrimaryGuy2+Floor1PrimaryGirl1-convo',
    facing: Facing.RIGHT_UP,
    animationState: AnimationState.IDLE,
  };
  exp.Floor1PrimaryGirl1 = {
    name: 'Floor1PrimaryGirl1',
    nameLabel: 'Girl',
    spriteBase: 'girl6',
    talkTrigger: 'Floor1PrimaryGuy2+Floor1PrimaryGirl1-convo',
    facing: Facing.LEFT_DOWN,
    animationState: AnimationState.IDLE,
  };

  return exp;
};
