import { loadTiles } from 'model/sprite';
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

function parseQuery(queryString: string): Record<string, string> {
  const query = {};
  const pairs = (queryString[0] === '?'
    ? queryString.substr(1)
    : queryString
  ).split('&');
  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i].split('=');
    query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
  }
  return query;
}

export const main = async (): Promise<void> => {
  // Mount this first so that appInterface is MOST LIKELY set when loading the overworld,
  // which may depend on that being loaded because it calls the load trigger for a room
  // when it starts.
  // Still, it's loose.  This depends on the ui mounting fully in the time it takes
  // for the rest of the app to load.  This is probably fine, but is not definitive.
  mountUi();

  initScene();
  const scene = getCurrentScene();
  await loadRPGScript('floor1', scene);
  await loadRPGScript('test', scene);

  await loadRes();
  await initDb();
  await loadTiles();
  getCanvas(); // loads the canvas before the events so getBoundingClientRect works correctly
  setDrawScale(2);
  initEvents();
  initHooks();
  runMainLoop();

  console.log('initiate overworld');
  const player = playerCreate({
    name: 'Ada',
    spriteBase: 'ada',
    // stats: battleStatsCreate(),
    facing: Facing.LEFT_DOWN,
    animationState: AnimationState.IDLE,
    skills: [],
  });

  const query = parseQuery(window.location.search);
  if (query.room) {
    const overworldTemplate = getOverworld(query.room);
    initiateOverworld(player, overworldTemplate);
  } else {
    initiateOverworld(player, getOverworld('TEST2'));
  }
};
