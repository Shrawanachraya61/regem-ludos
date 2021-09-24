import { OverworldTemplate } from 'model/overworld';
import { Room, createRoom, roomCopy } from 'model/room';
import { colors } from 'view/style';
import { TransformEase, Transform, Timer } from 'model/utility';

import * as battle1Json from 'map/battle1.json';
import * as battleTut1 from 'map/battle-tut1.json';

import * as testJson from 'map/test.json';
import * as test2Json from 'map/test2.json';
import * as test3 from 'map/test3.json';
import * as floor1Outside from 'map/floor1-outside.json';
import * as floor1Atrium from 'map/floor1-atrium.json';
import * as floor1Bowling from 'map/floor1-bowlingalley.json';
import * as floor1TutEntrance from 'map/floor1-tut-entrance.json';
import * as floor1TutVR1 from 'map/floor1-tut-vr1.json';
import * as floor1TutVR2 from 'map/floor1-tut-vr2.json';
import * as floor1TutVR3 from 'map/floor1-tut-vr3.json';
import * as floor1TutVR3West from 'map/floor1-tut-vr3-west.json';
import * as floor1TutVR3West2 from 'map/floor1-tut-vr3-west2.json';
import * as floor2South from 'map/floor2-south.json';
import * as floor2GuestroomHallway from 'map/floor2-guestroom-hallway.json';
import * as floor2Cafeteria from 'map/floor2-cafeteria.json';
import * as floor2North from 'map/floor2-north.json';
import * as floor2PrepRoom from 'map/floor2-preproom.json';
import * as floor2Sports from 'map/floor2-sports.json';

import * as bowlingAlleyStandalone from 'map/bowling-alley-standalone.json';

const rooms: Record<string, Room> = ((window as any).rooms = {});

// keys on this object are each a roomName
const overworldToRoom = {
  floor1Outside,
  floor1Atrium,
  floor1Bowling,
  floor1TutEntrance,
  floor1TutVR1,
  floor1TutVR2,
  floor1TutVR3,
  floor1TutVR3West,
  floor1TutVR3West2,

  floor2South,
  floor2GuestroomHallway,
  floor2Cafeteria,
  floor2North,
  floor2PrepRoom,
  floor2Sports,

  test3,

  battle1: battle1Json,
  battleTut1,

  bowlingAlleyStandalone,
};

const loadRoom = async (roomName: string, json: any) => {
  rooms[roomName] = await createRoom(roomName, json);
};

export const loadRooms = async (): Promise<void> => {
  console.log('loading rooms');

  await loadRoom('test', testJson);
  await loadRoom('test2', test2Json);

  for (const roomName in overworldToRoom) {
    await loadRoom(roomName, overworldToRoom[roomName]);
  }

  console.log('rooms loaded', rooms);
};

export const getRoom = (mapName: string): Room => {
  const room = rooms[mapName];
  if (!room) {
    throw new Error(`No room exists with name: "${mapName}"`);
  }
  return roomCopy(room);
};

const exp: Record<
  string,
  OverworldTemplate
> = ((window as any).overworlds = {});
export const get = (key: string): OverworldTemplate => {
  const result = exp[key];
  if (!result) {
    throw new Error(`No overworld exists with name: ${key}`);
  }
  return {
    ...result,
  };
};

export const getIfExists = (key: string): OverworldTemplate | null => {
  const result = exp[key];
  if (!result) {
    return null;
  }
  return {
    ...result,
  };
};

export const init = async () => {
  await loadRooms();

  const STANDARD_RIGHT_TO_LEFT_BG_TRANSFORM = new Transform(
    [0, 0, 0],
    [-684, 0, 0],
    30000,
    TransformEase.LINEAR
  );

  const setTransformTiming = (t: Transform, ms: number) => {
    const newT = Transform.copy(t);
    t.timer = new Timer(ms);
    t.timer.start();
    return newT;
  };

  exp.test = {
    roomName: 'test',
    backgroundColor: colors.GREY,
  };
  exp.test2 = {
    roomName: 'test2',
    loadTriggerName: 'floor1',
    backgroundColor: colors.GREY,
  };

  for (const roomName in overworldToRoom) {
    exp[roomName] = {
      roomName,
      loadTriggerName: roomName,
      backgroundColor: colors.GREY,
    };
  }

  Object.assign(exp.bowlingAlleyStandalone ?? {}, {
    backgroundColor: colors.BLACK,
    music: 'music_bowling',
  });

  exp.floor1Outside.backgroundColor = colors.DARKBLUE;

  Object.assign(exp.floor1Atrium ?? {}, {
    backgroundColor: colors.BLACK,
    music: 'music_atrium',
  });
  Object.assign(exp.floor1Bowling ?? {}, {
    // backgroundColor: colors.BLACK,
    music: 'music_bowling',
  });

  Object.assign(exp.floor2GuestroomHallway ?? {}, {
    backgroundColor: colors.BLACK,
    // music: 'music_atrium',
  });

  Object.assign(exp.floor1TutVR1 ?? {}, {
    backgroundColor: colors.DARKBLUE,
    backgroundImage: 'bg-clouds',
    backgroundTransform: STANDARD_RIGHT_TO_LEFT_BG_TRANSFORM,
  });
  Object.assign(exp.floor1TutVR2 ?? {}, {
    backgroundColor: colors.DARKBLUE,
    backgroundImage: 'bg-clouds',
    backgroundTransform: STANDARD_RIGHT_TO_LEFT_BG_TRANSFORM,
  });
  Object.assign(exp.floor1TutVR3 ?? {}, {
    backgroundColor: colors.DARKBLUE,
    backgroundImage: 'bg-clouds',
    backgroundTransform: STANDARD_RIGHT_TO_LEFT_BG_TRANSFORM,
  });
  Object.assign(exp.floor1TutVR3West ?? {}, {
    backgroundColor: colors.DARKBLUE,
    backgroundImage: 'bg-clouds',
    backgroundTransform: STANDARD_RIGHT_TO_LEFT_BG_TRANSFORM,
  });
  Object.assign(exp.floor1TutVR3West2 ?? {}, {
    backgroundColor: colors.DARKBLUE,
    backgroundImage: 'bg-clouds',
    backgroundTransform: STANDARD_RIGHT_TO_LEFT_BG_TRANSFORM,
  });
};
