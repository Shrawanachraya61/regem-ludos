import {
  getCurrentScene,
  setCurrentOverworld,
  setCurrentPlayer,
  setCurrentScene,
} from 'model/generics';
import { get as getCharacter } from 'db/characters';
import { playerCreateNew } from 'model/player';
import {
  initiateOverworld,
  overworldKeysDisabledOnLoadVal,
} from 'controller/overworld-management';
import { get as getOverworld } from 'db/overworlds';

import { sceneCreate, sceneIsWaiting } from 'model/scene';
import initDb from 'db';
import { disableConsole, enableConsole } from 'view/console';
import { createAndCallScript, updateScene } from 'controller/scene-management';
import {
  getAppState,
  initAppStateReducers,
} from '../helpers/immediate-reducer';
import { getConfirmKey, getCurrentKeyHandler } from 'controller/events';
import { AppSection } from 'model/store';

const pressCutsceneInput = () => {
  const cb = getCurrentKeyHandler();
  if (cb) {
    cb({ key: getConfirmKey() } as any);
    updateScene(getCurrentScene());
  }
};

beforeEach(async () => {
  // enableConsole();
  const scene = sceneCreate();
  setCurrentScene(scene);
  await initDb(scene);
  const adaTemplate = getCharacter('Ada');
  const player = playerCreateNew(adaTemplate);
  setCurrentPlayer(player);
  const overworld = initiateOverworld(player, getOverworld('test'));
  setCurrentOverworld(overworld);

  initAppStateReducers();
});

afterEach(() => {
  disableConsole();
});

describe('RPGScript Transitions', () => {
  // enableConsole();
  // wrapper.debug();
  // console.log(wrapper.container.textContent);
  // disableConsole();

  test('enterCombat hides the game ui when transitioning', async () => {
    const script = `
    +setConversation(Ada, 0);
    +enterCombat(ENCOUNTER_IMPOSSIBLE, true);
    +endConversation(0);
`;

    const scene = getCurrentScene();
    createAndCallScript(scene, script);
    expect(sceneIsWaiting(scene)).toEqual(false);
    expect(getAppState().sections).not.toContain(AppSection.Debug);
  });

  test('changeRoom disables input while transitioning', async () => {
    const script = `
    +setConversation(Ada, 0);
    +changeRoom(ENCOUNTER_IMPOSSIBLE, true);
    +endConversation(0);
`;
    const scene = getCurrentScene();
    createAndCallScript(scene, script);
    expect(sceneIsWaiting(scene)).toEqual(false);
    expect(overworldKeysDisabledOnLoadVal).toEqual(true);
  });
});
