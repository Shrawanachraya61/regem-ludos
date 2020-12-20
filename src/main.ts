import { loadTiles } from 'model/sprite';
import { loadRooms } from 'model/room';
import { runMainLoop } from 'controller/loop';
import { loadRes } from 'controller/res-loader';
import { getCanvas, setDrawScale } from 'model/canvas';
import { initEvents } from 'controller/events';
import { mountUi } from 'view/ui';
import { initHooks } from 'view/hooks';
import initDb from 'db';

export const main = async (): Promise<void> => {
  await loadTiles();
  await loadRooms();
  await loadRes();
  getCanvas(); // loads the canvas before the events so getBoundingClientRect works correctly
  setDrawScale(1);
  initEvents();
  initHooks();
  initDb();
  mountUi();
  runMainLoop();
};
