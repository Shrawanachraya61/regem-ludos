import { h } from 'preact';
import { render } from '@testing-library/preact';
import {
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
import { AppStateInitial } from 'model/store';
import { disableConsole, enableConsole } from 'view/console';

beforeEach(async () => {
  const scene = sceneCreate();
  setCurrentScene(scene);
  await initDb(scene);
  const adaTemplate = getCharacter('Ada');
  const player = playerCreateNew(adaTemplate);
  setCurrentPlayer(player);
  const overworld = initiateOverworld(player, getOverworld('test'));
  setCurrentOverworld(overworld);
});

describe('Cutscene', () => {
  // enableConsole();
  // wrapper.debug();
  // console.log(wrapper.container.textContent);
  // disableConsole();

  test('The CutsceneSection component renders in tests without errors', async () => {
    const wrapper = render(
      <AppShim
        state={{
          ...AppStateInitial,
          cutscene: {
            ...AppStateInitial.cutscene,
            text: 'Example text.',
            visible: true,
          },
        }}
      >
        <CutsceneSection renderImmediate={true} />
      </AppShim>
    );

    expect(wrapper.container.textContent).toMatch('Example text.');
  });

  test("The CutsceneSection component displays a speaker's name with their dialogue", async () => {
    const wrapper = render(
      <AppShim
        state={{
          ...AppStateInitial,
          cutscene: {
            ...AppStateInitial.cutscene,
            text: 'Speaker says something.',
            speakerName: 'SpeakerA',
            visible: true,
          },
        }}
      >
        <CutsceneSection renderImmediate={true} />
      </AppShim>
    );

    expect(wrapper.container.textContent).toMatch('SpeakerA');
    expect(wrapper.container.textContent).toMatch('Speaker says something.');
  });
});
