import { h } from 'preact';
import { render } from '@testing-library/preact';
import {
  getCurrentPlayer,
  setCurrentOverworld,
  setCurrentPlayer,
  setCurrentScene,
} from 'model/generics';
import { get as getCharacter } from 'db/characters';
import { playerCreateNew } from 'model/player';
import { initiateOverworld } from 'controller/overworld-management';
import { get as getOverworld } from 'db/overworlds';

import { AppShim } from '../helpers/AppShim';

import MenuMain from 'view/components/MenuSection/MenuMain';
import { sceneCreate } from 'model/scene';
import initDb from 'db';
import MenuStatus from 'view/components/MenuSection/MenuStatus';

beforeAll(async () => {
  const scene = sceneCreate();
  setCurrentScene(scene);
  await initDb(scene);
  const adaTemplate = getCharacter('Ada');
  const player = playerCreateNew(adaTemplate);
  setCurrentPlayer(player);
  const overworld = initiateOverworld(player, getOverworld('test2'));
  setCurrentOverworld(overworld);
});

describe('GameMenu', () => {
  test('Game Main Menu Render', () => {
    const wrapper = render(
      <AppShim>
        <MenuMain />
      </AppShim>
    );
    expect(wrapper.container.textContent).toMatch(/Ada/);
    [
      'Menu',
      'Equipment',
      'Journal',
      'Items',
      'Status',
      'Positions',
      'Load',
      'Quit',
      'Close',
    ].forEach(item => {
      expect(wrapper.container.textContent).toContain(item);
    });
  });
  test('Status Menu Render', () => {
    const wrapper = render(
      <AppShim>
        <MenuStatus
          isInactive={false}
          onClose={() => void 0}
          player={getCurrentPlayer()}
        />
      </AppShim>
    );
    expect(wrapper.container.textContent).toMatch(/Ada/);
    expect(wrapper.container.textContent).toContain('POW');
    expect(wrapper.container.textContent).toContain('ACC');
    expect(wrapper.container.textContent).toContain('FOR');
    expect(wrapper.container.textContent).toContain('CON');
    expect(wrapper.container.textContent).toContain('RES');
    expect(wrapper.container.textContent).toContain('SPD');
    expect(wrapper.container.textContent).toContain('EVA');
  });
});
