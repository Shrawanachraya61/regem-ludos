import { BattleActions } from 'controller/battle-actions';
import { setAtMarker } from 'controller/scene/scene-commands';
import { createIntervalAI, createWalkerAI } from 'db/overworld-ai';
import { battleStatsCreate } from 'model/battle';
import {
  AnimationState,
  Facing,
  CharacterTemplate,
  WeaponEquipState,
  characterSetFacing,
  Character,
  characterSetSpriteBase,
} from 'model/character';
import { getCurrentRoom } from 'model/generics';
import { roomRemoveCharacter } from 'model/room';
import { randInArr } from 'utils';

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

  exp.Floor1OutsideWalker1 = {
    name: 'Floor1OutsideWalker1',
    spriteBase: 'guy3',
    facing: Facing.LEFT_UP,
    animationState: AnimationState.IDLE,
    // speed: 5,
    overworldAi: createWalkerAI(['MarkerWalker1', 'MarkerWalker2'], {
      pauseDurationMs: 7000,
      onReachDestination: ch => {
        const chSprites = ['guy', 'guy2', 'guy3', 'guy4'];
        characterSetSpriteBase(ch, randInArr(chSprites));
        // setAtMarker(ch.name, 'MarkerWalker2');
      },
    }),
  };
  exp.Floor1OutsideWalker2 = {
    name: 'Floor1OutsideWalker2',
    spriteBase: 'girl3',
    facing: Facing.LEFT_UP,
    animationState: AnimationState.IDLE,
    speed: 1.1,
    overworldAi: createWalkerAI(['MarkerWalker1', 'MarkerWalker2'], {
      pauseDurationMs: 7000,
      onReachDestination: ch => {
        const chSprites = ['guy5', 'guy6', 'guy7', 'guy8', 'girl'];
        characterSetSpriteBase(ch, randInArr(chSprites));
      },
    }),
  };
  exp.Floor1OutsideWalker3 = {
    name: 'Floor1OutsideWalker2',
    spriteBase: 'guy8',
    facing: Facing.LEFT_UP,
    animationState: AnimationState.IDLE,
    speed: 0.9,
    overworldAi: createWalkerAI(['MarkerWalker1', 'MarkerWalker2'], {
      pauseDurationMs: 7000,
      onReachDestination: ch => {
        const chSprites = ['girl2', 'girl3', 'girl4', 'girl5', 'girl6'];
        characterSetSpriteBase(ch, randInArr(chSprites));
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
    facing: Facing.RIGHT_DOWN,
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
  exp.Floor1AtriumEmployeeJason2 = { ...exp.Floor1AtriumEmployeeJason };
  exp.Floor1AtriumEmployeeJason2.name = 'Jason';

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
    nameLabel: 'Ping Pong Girl',
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
    overworldAi: createWalkerAI(['MarkerGreeterA', 'MarkerGreeterB'], {
      pauseDurationMs: 3500,
      onReachDestination: ch => {
        characterSetFacing(ch, Facing.LEFT_DOWN);
      },
    }),
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
    spriteBase: 'guy8',
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
    talkTrigger: 'Floor1PrimaryGuy2-Floor1PrimaryGirl1-convo',
    facing: Facing.RIGHT_UP,
    animationState: AnimationState.IDLE,
  };
  exp.Floor1PrimaryGirl1 = {
    name: 'Floor1PrimaryGirl1',
    nameLabel: 'Girl',
    spriteBase: 'girl6',
    talkTrigger: 'Floor1PrimaryGuy2-Floor1PrimaryGirl1-convo',
    facing: Facing.LEFT_DOWN,
    animationState: AnimationState.IDLE,
  };

  exp.Floor1East1PrizeEmployee = {
    name: 'Shopkeep',
    nameLabel: 'Prize Employee',
    spriteBase: 'employee-guy',
    talkTrigger: 'Floor1East1PrizeEmployee',
    facing: Facing.RIGHT_DOWN,
    animationState: AnimationState.IDLE,
    overworldAi: createIntervalAI(2000, (ch: Character) => {
      characterSetFacing(ch, randInArr([Facing.LEFT_UP, Facing.RIGHT_DOWN]));
    }),
  };

  exp.Floor1DNDPlayer1 = {
    name: 'DNDPlayer1',
    nameLabel: 'Tabletop Player',
    spriteBase: 'guy3',
    talkTrigger: 'Floor1East2_DNDPlayer1',
    facing: Facing.RIGHT_UP,
    animationState: AnimationState.IDLE,
    overworldAi: createWalkerAI(['MarkerPaceA', 'MarkerPaceB'], {
      pauseDurationMs: 2000,
      onReachDestination: ch => {
        characterSetFacing(ch, Facing.RIGHT_UP);
      },
    }),
  };
  exp.Floor1DNDPlayer2 = {
    name: 'DNDPlayer2',
    nameLabel: 'Tabletop Player',
    spriteBase: 'guy7',
    talkTrigger: 'Floor1East2_DNDPlayer2',
    facing: Facing.LEFT_DOWN,
    animationState: AnimationState.IDLE,
    overworldAi: createWalkerAI(['Marker2PaceA', 'Marker2PaceB'], {
      pauseDurationMs: 5000,
      onReachDestination: ch => {
        characterSetFacing(ch, Facing.LEFT_DOWN);
      },
    }),
  };
  exp.Floor1DNDPlayer3 = {
    name: 'DNDPlayer3',
    nameLabel: 'Tabletop Player',
    spriteBase: 'guy2',
    talkTrigger: 'Floor1East2_DNDPlayer3',
    facing: Facing.RIGHT_DOWN,
    animationState: AnimationState.IDLE,
  };
  exp.Floor1DNDPlayer4 = {
    name: 'DNDPlayer4',
    nameLabel: 'Tabletop Player',
    spriteBase: 'girl7',
    talkTrigger: 'Floor1East2_DNDPlayer4',
    facing: Facing.RIGHT_UP,
    animationState: AnimationState.IDLE,
  };

  exp.Floor1ZagPlayer = {
    name: 'ZagPlayer',
    nameLabel: 'Zag Player',
    spriteBase: 'guy10',
    talkTrigger: 'Floor1East2_ZagPlayer',
    facing: Facing.RIGHT_UP,
    animationState: AnimationState.IDLE,
  };

  exp.Floor1SaveRoomEmployee = {
    name: 'Employee',
    nameLabel: 'Employee',
    spriteBase: 'employee-guy',
    talkTrigger: 'Floor1West1_Employee',
    facing: Facing.LEFT_DOWN,
    animationState: AnimationState.IDLE,
    overworldAi: createIntervalAI(2000, (ch: Character) => {
      characterSetFacing(
        ch,
        randInArr([
          Facing.LEFT_DOWN,
          Facing.LEFT,
          Facing.DOWN,
          Facing.RIGHT_DOWN,
        ])
      );
    }),
  };

  exp.Floor1StorageEmployee = {
    name: 'Employee',
    nameLabel: 'Storage Employee',
    spriteBase: 'employee-guy5',
    talkTrigger: 'Floor1East1Storage_Employee',
    facing: Facing.RIGHT_UP,
    animationState: AnimationState.IDLE,
  };

  exp.Floor1ShadyPerson = {
    name: 'ShadyPerson',
    nameLabel: 'Inconspicuous Patron',
    spriteBase: 'girl4',
    talkTrigger: 'Floor1ShadyPerson',
    facing: Facing.RIGHT_DOWN,
    animationState: AnimationState.IDLE,
    speed: 2.5,
  };

  return exp;
};
