import {
  getCurrentScene,
  setCurrentOverworld,
  setCurrentPlayer,
  setCurrentScene,
} from 'model/generics';
import { get as getCharacter } from 'db/characters';
import { playerCreateNew } from 'model/player';
import { initiateOverworld } from 'controller/overworld-management';
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
import { pressCutsceneInput } from '../helpers/cutscene-helpers';

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

describe('RPGScript Conversations', () => {
  // enableConsole();
  // wrapper.debug();
  // console.log(wrapper.container.textContent);
  // disableConsole();

  test('The setConversation command mutates the app state to display a single-person conversation', async () => {
    const script = `
    +setConversation(Ada, 0);
    Ada: "This is a test."
    Ada: "Line 2."
    +endConversation(0);
`;

    const scene = getCurrentScene();
    createAndCallScript(scene, script);
    expect(getAppState().cutscene.visible).toEqual(true);
    expect(getAppState().cutscene.speakerName).toEqual('Ada');
    expect(getAppState().cutscene.text).toMatch('This is a test');
    expect(getAppState().cutscene.portraitCenter).toMatch('ada');
    expect(sceneIsWaiting(scene)).toEqual(true);

    pressCutsceneInput();

    expect(getAppState().cutscene.text).toMatch('Line 2');
    expect(getAppState().cutscene.portraitCenter).toMatch('ada');

    pressCutsceneInput();

    expect(sceneIsWaiting(scene)).toEqual(false);
  });

  test('The setConversation command mutates the app state to display a two-person conversation', async () => {
    const script = `
    +setConversation2(Ada, Conscience, 0);
    Ada: "This is a test."
    Conscience: "This is also a test."
    Ada: "And back to me."
    Narrator: "I am the narrator."
    +endConversation(0);
`;

    const scene = getCurrentScene();
    createAndCallScript(scene, script);
    expect(getAppState().cutscene.visible).toEqual(true);
    expect(getAppState().cutscene.speakerName).toEqual('Ada');
    expect(getAppState().cutscene.text).toMatch('This is a test');
    expect(sceneIsWaiting(scene)).toEqual(true);

    pressCutsceneInput();

    expect(getAppState().cutscene.text).toMatch('This is also a test');
    expect(getAppState().cutscene.portraitRight).toMatch('conscience');

    pressCutsceneInput();

    expect(getAppState().cutscene.text).toMatch('And back to me');
    expect(getAppState().cutscene.portraitLeft).toMatch('ada');

    pressCutsceneInput();

    expect(getAppState().cutscene.speakerName).toMatch('');
    expect(getAppState().cutscene.text).toMatch('I am the narrator');
    expect(getAppState().cutscene.portraitLeft).toMatch('');
    expect(getAppState().cutscene.portraitRight).toMatch('');

    pressCutsceneInput();

    expect(sceneIsWaiting(scene)).toEqual(false);
  });
});
