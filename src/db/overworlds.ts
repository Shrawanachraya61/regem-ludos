import { OverworldTemplate } from 'model/overworld';
import { Room, createRoom } from 'model/room';
import { colors } from 'view/style';

import * as battle1Json from 'map/battle1.json';
import * as testJson from 'map/test.json';
import * as test2Json from 'map/test2.json';
import * as floor1Outside from 'map/floor1-outside.json';
import * as floor1Atrium from 'map/floor1-atrium.json';
import * as floor1Bowling from 'map/floor1-bowlingalley.json';
import * as floor2Entrance from 'map/floor2-entrance.json';
import * as floor2Cafeteria from 'map/floor2-cafeteria.json';
import * as floor2North from 'map/floor2-north.json';
import * as floor2preproom from 'map/floor2-preproom.json';

const rooms: Record<string, Room> = ((window as any).rooms = {});

const overworldToRoom = {
  floor1Outside,
  floor1Atrium,
  floor1Bowling,
  floor2Entrance,
  floor2Cafeteria,
  floor2North,
  floor2preproom,
};

const loadRoom = async (roomName: string, json: any) => {
  rooms[roomName] = await createRoom(roomName, json);
};

export const loadRooms = async (): Promise<void> => {
  console.log('loading rooms');

  await loadRoom('battle1', battle1Json);
  await loadRoom('test', testJson);
  await loadRoom('test2', test2Json);

  for (const roomName in overworldToRoom) {
    await loadRoom(roomName, overworldToRoom[roomName]);
  }

  console.log('rooms loaded', rooms);
};

export const getRoom = (mapName: string): Room => {
  return rooms[mapName];
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

  exp.TEST = {
    roomName: 'test',
    backgroundColor: 'black',
  };
  exp.TEST2 = {
    roomName: 'test2',
    loadTriggerName: 'floor1',
    backgroundColor: 'black',
  };

  for (const roomName in overworldToRoom) {
    exp[roomName] = {
      roomName,
      loadTriggerName: roomName,
      backgroundColor: 'black',
    };
  }

  exp.floor1Outside.backgroundColor = colors.DARKBLUE;
};
