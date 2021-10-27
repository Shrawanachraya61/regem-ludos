import { h } from 'preact';
import { render } from '@testing-library/preact';
import {
  getCurrentPlayer,
  getCurrentScene,
  setCurrentOverworld,
  setCurrentPlayer,
  setCurrentScene,
} from 'model/generics';
import { get as getCharacter } from 'db/characters';
import { playerCreateNew } from 'model/player';
import { initiateOverworld } from 'controller/overworld-management';
import { get as getOverworld } from 'db/overworlds';

import { AppShim } from '../helpers/AppShim';

import { sceneCreate } from 'model/scene';
import initDb from 'db';
import CutsceneSection from 'view/components/CutsceneSection';
import { createAndCallScript } from 'controller/scene-management';
import { getConfirmKey } from 'controller/events';
import { beginLoop, endLoop } from '../helpers/loop';
import { getUiInterface } from 'view/ui';

beforeAll(async () => {
  const scene = sceneCreate();
  setCurrentScene(scene);
  await initDb(scene);
  const adaTemplate = getCharacter('Ada');
  const player = playerCreateNew(adaTemplate);
  setCurrentPlayer(player);
  const overworld = initiateOverworld(player, getOverworld('test'));
  setCurrentOverworld(overworld);
});

const task = cb => {
  return new Promise(resolve => {
    cb();
    resolve(true);
  });
};

describe.skip('Cutscene', () => {
  test('test-setConversation', async () => {
    const loop = beginLoop();

    const scriptSrc = `
      +setConversation('Ada');
      Ada: "This script tests 'setConversation'."
      +endConversation();
`;

    await createAndCallScript(getCurrentScene(), scriptSrc);

    // const wrapper = render(
    //   <AppShim>
    //     <CutsceneSection />
    //   </AppShim>
    // );

    // task(() => {
    //   const event = new KeyboardEvent('keydown', {
    //     keyCode: 88,
    //     key: getConfirmKey(),
    //   });
    //   document.dispatchEvent(event);
    // });
    // task(() => {
    //   const event = new KeyboardEvent('keyup', {
    //     keyCode: 88,
    //     key: getConfirmKey(),
    //   });
    //   document.dispatchEvent(event);
    // });
    // task(() => {
    //   console.log('wrapper.debug');
    //   wrapper.debug();
    // });

    // expect(wrapper.container.textContent).toContain('setConversation');

    expect(getUiInterface().appState.cutscene.text).toContain(
      'setConversation'
    );

    endLoop(loop);
  });
});
