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
import { evalCondition } from 'controller/scene-management';
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
} from 'controller/quest';

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

describe('Tic-Tac-Toe quest', () => {
  // enableConsole();
  // wrapper.debug();
  // console.log(wrapper.container.textContent);
  // disableConsole();

  const questName = 'TicTacToe';

  test('The Tic-Tac-Toe quest can be started by speaking with Floor1AtriumTicTacToeGirl', async () => {
    const scene = getCurrentScene();
    const quest = getQuest(questName);
    const chName = 'Floor1AtriumTicTacToeGirl';
    await invokeTalkTriggerSkip(chName);
    expect(
      evalCondition(scene, {
        type: 'is',
        args: [quest.questStartScriptKey],
      })
    ).toEqual(true);
    expect(getCurrentQuestStep(scene, questName)?.i).toEqual(0);
    expect(questIsNotStarted(scene, quest)).toEqual(false);
  });

  test('When the quest is started, speaking with Floor1AtriumTicTacToeGirl does not advance it further', async () => {
    const scene = getCurrentScene();
    const quest = getQuest(questName);
    const chName = 'Floor1AtriumTicTacToeGirl';
    await invokeTalkTriggerSkip(chName);
    expect(
      evalCondition(scene, {
        type: 'is',
        args: [quest.questStartScriptKey],
      })
    ).toEqual(true);
    expect(
      evalCondition(scene, {
        type: 'is',
        args: [quest.questEndScriptKey],
      })
    ).toEqual(false);

    expect(getCurrentQuestStep(scene, questName)?.i).toEqual(0);
  });

  test('The quest can be completed', async () => {
    const scene = getCurrentScene();
    const quest = getQuest(questName);
    await callScriptSkip('floor1-atrium-TicTacToeGirl-complete');
    expect(questIsCompleted(scene, quest)).toEqual(true);
  });

  test('When the quest is completed, it does not start again', async () => {
    const scene = getCurrentScene();
    const quest = getQuest(questName);
    const chName = 'Floor1AtriumTicTacToeGirl';
    await invokeTalkTriggerSkip(chName);
    expect(questIsCompleted(scene, quest)).toEqual(true);
    expect(questIsNotStarted(scene, quest)).toEqual(false);
  });
});
