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

import { sceneCreate } from 'model/scene';
import initDb from 'db';
import { disableConsole, enableConsole } from 'view/console';
import { initAppStateReducers } from '../helpers/immediate-reducer';
import { get as getQuest } from 'db/quests';
import {
  callScriptSkip,
  invokeTalkTriggerSkip,
} from '../helpers/cutscene-helpers';
import {
  getCurrentQuestStep,
  questIsCompleted,
  questIsNotStarted,
} from 'model/quest';

beforeAll(async () => {
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

describe('Tutorial quest', () => {
  // enableConsole();
  // wrapper.debug();
  // console.log(wrapper.container.textContent);
  // disableConsole();

  const questName = 'Tutorial';

  test('The Tutorial quest can be started by speaking with Floor1AtriumDeskEmployee', async () => {
    const scene = getCurrentScene();
    const quest = getQuest(questName);
    const chName = 'Floor1AtriumDeskEmployee';
    expect(questIsNotStarted(scene, quest)).toEqual(true);
    await invokeTalkTriggerSkip(chName);
    expect(questIsNotStarted(scene, quest)).toEqual(false);
    expect(getCurrentQuestStep(scene, questName)?.i).toEqual(0);
  });

  test('The tutorial quest triggers increment the quest steps in order', async () => {
    const scripts = [
      'floor1-atrium-employee-jason-haptic-bracer',
      'floor1-tut-begin-vr3',
      'floor1-tut-VRPreBoss-spot-exit-portal',
      'floor1-tut-completed-tutorial',
    ];
    const scene = getCurrentScene();
    const quest = getQuest(questName);
    for (let i = 0; i < scripts.length; i++) {
      const scriptName = scripts[i];
      expect(getCurrentQuestStep(scene, questName)?.i).toEqual(i);
      await callScriptSkip(scriptName);
    }
    expect(questIsCompleted(scene, quest)).toEqual(true);
  });
});
