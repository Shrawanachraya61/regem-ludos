import { OverworldTemplate } from 'model/overworld';
import { Room, createRoom, roomCopy } from 'model/room';
import { colors } from 'view/style';
import { TransformEase, Transform, Timer } from 'model/utility';

import * as battle1Json from 'map/battle1.json';
import * as battleTut1 from 'map/battle-tut1.json';
import * as battleTutBoss from 'map/battle-tutBoss.json';

import * as testJson from 'map/test.json';
import * as test2Json from 'map/test2.json';
import * as test3 from 'map/test3.json';
import * as floor1Outside from 'map/floor1-outside.json';
import * as floor1Atrium from 'map/floor1-atrium.json';
import * as floor1Bowling from 'map/floor1-bowlingalley.json';
import * as floor1Primary from 'map/floor1-primary.json';
import * as floor1West1 from 'map/floor1-west1.json';
import * as floor1West2 from 'map/floor1-west2.json';
import * as floor1East1 from 'map/floor1-east1.json';
import * as floor1East1Storage from 'map/floor1-east1-storage.json';
import * as floor1East2 from 'map/floor1-east2.json';
import * as floor1TutEntrance from 'map/floor1-tut-entrance.json';
import * as floor1TutExit from 'map/floor1-tut-exit.json';
import * as floor1TutVR1 from 'map/floor1-tut-vr1.json';
import * as floor1TutVR2 from 'map/floor1-tut-vr2.json';
import * as floor1TutVR3 from 'map/floor1-tut-vr3.json';
import * as floor1TutVR3West from 'map/floor1-tut-vr3-west.json';
import * as floor1TutVR3West2 from 'map/floor1-tut-vr3-west2.json';
import * as floor1TutVR3East from 'map/floor1-tut-vr3-east.json';
import * as floor1TutVRPreBoss from 'map/floor1-tut-vr-pre-boss.json';
import * as floor1TutVRBoss from 'map/floor1-tut-vr-boss.json';
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
  floor1Primary,
  floor1West1,
  floor1West2,
  floor1East1,
  floor1East1Storage,
  floor1East2,
  floor1TutEntrance,
  floor1TutExit,
  floor1TutVR1,
  floor1TutVR2,
  floor1TutVR3,
  floor1TutVR3West,
  floor1TutVR3West2,
  floor1TutVR3East,
  floor1TutVRPreBoss,
  floor1TutVRBoss,

  floor2South,
  floor2GuestroomHallway,
  floor2Cafeteria,
  floor2North,
  floor2PrepRoom,
  floor2Sports,

  test3,

  battle1: battle1Json,
  battleTut1,
  battleTutBoss,

  bowlingAlleyStandalone,
};

const loadRoom = (roomName: string, json: any) => {
  rooms[roomName] = createRoom(roomName, json);
};

export const loadRooms = async (): Promise<void> => {
  console.log('loading rooms');

  loadRoom('test', testJson);
  loadRoom('test2', test2Json);

  for (const roomName in overworldToRoom) {
    loadRoom(roomName, overworldToRoom[roomName]);
  }

  console.log('rooms loaded');
};

export const getRoom = (mapName: string): Room => {
  const room = rooms[mapName];
  if (!room) {
    console.log(Object.keys(rooms));
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
  Object.assign(exp.floor1Primary ?? {}, {
    backgroundColor: colors.BLACK,
    music: 'music_atrium',
  });
  Object.assign(exp.floor1West1 ?? {}, {
    backgroundColor: colors.BLACK,
    music: 'music_atrium',
  });
  Object.assign(exp.floor1West2 ?? {}, {
    backgroundColor: colors.BLACK,
    music: 'music_atrium',
  });
  Object.assign(exp.floor1East1 ?? {}, {
    backgroundColor: colors.BLACK,
    music: 'music_store',
  });
  Object.assign(exp.floor1East1Storage ?? {}, {
    backgroundColor: colors.BLACK,
    music: 'music_snoop',
  });
  Object.assign(exp.floor1East2 ?? {}, {
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

  [
    'floor1TutVR1',
    'floor1TutVR2',
    'floor1TutVR3',
    'floor1TutVR3West',
    'floor1TutVR3West2',
    'floor1TutVR3East',
    'floor1TutVRPreBoss',
    'floor1TutVRBoss',
    'battleTut1',
    'battleTutBoss',
  ].forEach((name, i) => {
    Object.assign(exp[name] ?? {}, {
      backgroundColor: colors.DARKBLUE,
      backgroundImage: 'bg-clouds',
      backgroundTransform: STANDARD_RIGHT_TO_LEFT_BG_TRANSFORM,
      music: i <= 1 ? 'music_tutorial' : 'music_tutorial_dungeon',
    });
    if (name.includes('battle')) {
      exp[name].music = undefined;
    }
  });

  return loadRooms();
};
