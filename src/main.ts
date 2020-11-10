import { loadTiles } from 'model/sprite';
import { loadRooms, getRoom } from 'model/room';
import { loadRes } from 'model/loader';
import { setCurrentRoom } from 'model/scene';
import { runMainLoop } from 'controller/loop';

export const main = async (): Promise<void> => {
  await loadTiles();
  await loadRooms();
  await loadRes();

  const room = getRoom('battle1');
  console.log('loaded', room);
  setCurrentRoom(room);
  runMainLoop();
};
