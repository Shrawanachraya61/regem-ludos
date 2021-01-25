import { OverworldTemplate } from 'model/overworld';
import { Room, createRoom } from 'model/room';

import * as battle1Json from 'map/battle1.json';
import * as testJson from 'map/test.json';
import * as test2Json from 'map/test2.json';

const rooms: Record<string, Room> = {};

const loadRoom = async (roomName: string, json: any) => {
  rooms[roomName] = await createRoom(roomName, json);
};

export const loadRooms = async (): Promise<void> => {
  console.log('loading rooms');

  await loadRoom('battle1', battle1Json);
  await loadRoom('test', testJson);
  await loadRoom('test2', test2Json);

  console.log('rooms loaded', rooms);
};

export const getRoom = (mapName: string): Room => {
  return rooms[mapName];
};

const exp: Record<string, OverworldTemplate> = {};
export const get = (key: string): OverworldTemplate => {
  const result = exp[key];
  if (!result) {
    throw new Error(`No overworld exists with name: ${key}`);
  }
  return {
    ...result,
  };
};

export const init = async () => {
  await loadRooms();

  exp.TEST = {
    roomName: 'test',
  };
  exp.TEST2 = {
    roomName: 'test2',
    loadTriggerName: 'floor1',
  };
};
