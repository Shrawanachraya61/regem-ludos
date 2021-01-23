import { loadTiles } from 'model/sprite';
import { loadRooms } from 'model/room';
import { runMainLoop } from 'controller/loop';
import { loadRes } from 'controller/res-loader';
import { getCanvas, setDrawScale } from 'model/canvas';
import { initEvents } from 'controller/events';
import { mountUi } from 'view/ui';
import { initHooks } from 'view/hooks';
import { initScene } from 'model/scene';
import initDb from 'db';
import { loadRPGScript } from 'lib/rpgscript';
import {
  disableKeyUpdate,
  enableKeyUpdate,
  getCurrentScene,
} from 'model/generics';

import ArcadeCabinet, { ArcadeGamePath } from 'view/components/ArcadeCabinet';
import OverworldSection from 'view/components/OverworldSection';

import { get as getOverworld } from 'db/overworlds';
import { initiateOverworld } from 'controller/overworld-management';
import { getCurrentPlayer } from 'model/generics';
import { playerCreate } from 'model/player';
import {
  AnimationState,
  Facing,
  characterCreateFromTemplate,
} from 'model/character';

import { callScript } from 'controller/scene-management';
import { getAngleTowards } from 'utils';

export const main = async (): Promise<void> => {
  initDb();
  await loadTiles();
  await loadRes();
  getCanvas(); // loads the canvas before the events so getBoundingClientRect works correctly
  setDrawScale(2);
  initEvents();
  initHooks();
  initScene();

  const scene = getCurrentScene();
  await loadRPGScript('floor1', scene);
  await loadRPGScript('test', scene);

  await loadRooms();

  // console.log('GET ANGLE', getAngleTowards([51, 217], [60, 52]));
  // console.log('GET ANGLE', getAngleTowards([51, 200], [70, 52]));

  console.log('initiate overworld');
  const player = playerCreate({
    name: 'Ada',
    spriteBase: 'ada',
    // stats: battleStatsCreate(),
    facing: Facing.LEFT_DOWN,
    animationState: AnimationState.IDLE,
    skills: [],
  });
  initiateOverworld(player, getOverworld('TEST2'), [35, 205, 0]);

  mountUi();
  runMainLoop();
};
