import { loadTiles } from 'model/sprite';
import { runMainLoop } from 'controller/loop';
import { loadRes } from 'controller/res-loader';
import { getCanvas, setDrawScale } from 'model/canvas';
import { initEvents } from 'controller/events';
import { getUiInterface, mountUi, renderUi } from 'view/ui';
import { initHooks } from 'view/hooks';
import { initScene } from 'model/scene';
import initDb from 'db';
import { loadRPGScript } from 'lib/rpgscript';
import {
  disableKeyUpdate,
  enableKeyUpdate,
  getCurrentScene,
  getCurrentPlayer,
  getCurrentRoom,
  setUseZip,
  setTimeLoaded,
  setCurrentPlayer,
} from 'model/generics';

import ArcadeCabinet, { ArcadeGamePath } from 'view/components/ArcadeCabinet';
import OverworldSection from 'view/components/OverworldSection';
import { get as getOverworld } from 'db/overworlds';
import {
  enableOverworldControl,
  initiateOverworld,
} from 'controller/overworld-management';
import { playerCreate } from 'model/player';
import {
  AnimationState,
  Facing,
  characterCreateFromTemplate,
  characterCreate,
  characterEquipItem,
} from 'model/character';

import { callScript } from 'controller/scene-management';
import { getAngleTowards } from 'utils';
import { battleStatsCreate } from 'model/battle';
import { BattleActions } from 'controller/battle-actions';
import { get as getCharacter } from 'db/characters';
import { createPFPath, pfPathToRoomPath } from 'controller/pathfinding';
import {
  loadGame,
  loadSettingsFromLS,
  setCurrentSettings,
} from 'controller/save-management';
import { awaitAllRoomProps, loadDynamicPropsTileset } from 'model/room';
import { showModal } from 'controller/ui-actions';
import { ModalSection } from 'model/store';
import { playMusic, loadSoundSpritesheet } from 'model/sound';
import { get as getItem } from 'db/items';
import { colors } from 'view/style';
import { useEffect } from 'preact/hooks';
import { beginQuest } from 'controller/quest';
import { getIfExists as getSave } from 'db/saves';

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

const loadingTick = () => {
  const loading = document.getElementById('page-loading-progress');
  if (loading) {
    const div = document.createElement('div');
    div.style.background = colors.DARKBLUE;
    div.style.border = '1px solid ' + colors.WHITE;
    div.style.width = '16px';
    div.style.height = '32px';
    div.style.margin = '4px 0px';
    div.style['border-radius'] = '4px';
    loading.appendChild(div);
    // loading.style.color = '#42CAFD';
  }
};

export const main = async (): Promise<void> => {
  setUseZip(true);
  console.time('load');

  // Mount this first so that appInterface is MOST LIKELY set when loading the overworld,
  // which may depend on that being loaded because it calls the load trigger for a room
  // when it starts.
  // Still, it's loose.  This depends on the ui mounting fully in the time it takes
  // for the rest of the app to load.  This is probably fine, but is not definitive.
  mountUi();

  console.log('load rpgscript');
  console.time('rpgscript');
  initScene();
  const scene = getCurrentScene();
  await Promise.all([
    loadRPGScript('test2', scene),
    loadRPGScript('test', scene),
    loadRPGScript('example', scene),
    loadRPGScript('utils', scene),
    loadRPGScript('floor1', scene),
    loadRPGScript('floor1/floor1-tut', scene),
    loadRPGScript('floor2-throne-room', scene),
    loadRPGScript('floor2/jesse-cafeteria', scene),
    loadRPGScript('intro', scene),
    loadRPGScript('bowling', scene),
  ]);

  console.timeEnd('rpgscript');
  loadingTick();

  console.log('load res');

  console.time('sound-spritesheet');
  await loadSoundSpritesheet('foley/foley.mp3');
  console.timeEnd('sound-spritesheet');
  console.time('res');
  await loadRes(loadingTick);
  // Need this loaded to load rooms, some props need height info to load properly
  await loadDynamicPropsTileset();
  console.timeEnd('res');

  console.log('init db');
  console.time('db');
  await initDb();

  loadingTick();

  // loading db might load some prop images dynamically, this waits for those to load
  await awaitAllRoomProps();

  console.log('load tiles');
  await loadTiles();
  console.timeEnd('db');

  loadingTick();

  try {
    const settings = loadSettingsFromLS();
    setCurrentSettings(settings);
    console.log('Settings have been loaded from localStorage.');
  } catch (e) {
    console.log('Settings have NOT been loaded from localStorage.');
  }

  console.log('create canvas');
  getCanvas(); // loads the canvas before the events so getBoundingClientRect works correctly
  setDrawScale(4);
  initEvents();
  initHooks();

  const adaTemplate = getCharacter('Ada');
  const player = playerCreate(adaTemplate);

  characterEquipItem(player.leader, player.backpack[0]);

  const conscience = characterCreateFromTemplate(getCharacter('Conscience'));
  player.party.push(conscience);
  // player.party.push(conscience);
  // player.party.push(conscience);
  player.partyStorage.push(conscience);
  // player.partyStorage.push(conscience);
  // player.partyStorage.push(conscience);
  // player.partyStorage.push(conscience);
  player.battlePositions.push(conscience);

  // player.leader.hp = 0;

  characterEquipItem(conscience, player.backpack[1]);

  const loading = document.getElementById('page-loading');
  if (loading) {
    loading.style.display = 'none';
  }

  console.timeEnd('load');
  setTimeLoaded(+new Date());

  await new Promise<void>(resolve => {
    const touchSomething = () => {
      window.removeEventListener('keydown', touchSomething);
      window.removeEventListener('mousedown', touchSomething);
      resolve();
    };
    window.addEventListener('keydown', touchSomething);
    window.addEventListener('mousedown', touchSomething);

    const pressAnyKey = document.getElementById('page-press-any-key');
    if (pressAnyKey) {
      pressAnyKey.style.display = 'flex';
    }
  });

  const pressAnyKey = document.getElementById('page-press-any-key');
  if (pressAnyKey) {
    pressAnyKey.style.display = 'none';
  }

  console.log('initiate overworld');
  const query = parseQuery(window.location.search);
  if (query.room) {
    const overworldTemplate = getOverworld(query.room);
    initiateOverworld(player, overworldTemplate);
  } else if (query.save) {
    // load save
    setCurrentPlayer(player);
    const save = getSave(query.save);
    console.log('Load save from QueryParams', save);
    if (!save) {
      const loading = document.getElementById('page-loading');
      if (loading) {
        loading.style.display = 'flex';
        loading.style.color = colors.RED;
        loading.innerHTML =
          'The save specified in the query string does not exist in the save database.';
      }
      return;
    }
    loadGame(save);
  } else {
    initiateOverworld(player, getOverworld('test2'));
  }
  enableOverworldControl();

  let debounceResizeId: any;
  window.addEventListener('resize', () => {
    if (debounceResizeId !== false) {
      clearTimeout(debounceResizeId);
    }
    debounceResizeId = setTimeout(() => {
      getUiInterface().render();
      debounceResizeId = false;
    }, 50);
  });

  console.log('run loop');
  runMainLoop();

  (document.getElementById('controls') as any).style.display = 'none';
  renderUi();

  // HudGamepad.GamePad.setup({
  //   canvas: 'controls',
  //   select: false,
  //   trace: true,
  //   debug: true,
  //   buttons: [
  //     { name: 'x', color: 'rgba(255,255,0,0.5)' },
  //     { name: 'y', color: 'rgba(0,255,255,0.75)' },
  //   ],
  // });
};
