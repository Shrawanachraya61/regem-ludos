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
import { playerAddItem, playerCreateNew } from 'model/player';
import { initiateOverworld } from 'controller/overworld-management';
import { get as getOverworld } from 'db/overworlds';

import { AppShim } from '../helpers/AppShim';
import { disableConsole, enableConsole } from 'view/console';

import MenuMain from 'view/components/MenuSection/MenuMain';
import MenuStatus from 'view/components/MenuSection/MenuStatus';
import MenuEquipment from 'view/components/MenuSection/MenuEquipment';
import MenuJournal from 'view/components/MenuSection/MenuJournal';
import MenuItems from 'view/components/MenuSection/MenuItems';
import MenuPositions from 'view/components/MenuSection/MenuPositions';
import MenuLoad from 'view/components/MenuSection/MenuLoad';

import { sceneCreate } from 'model/scene';
import initDb from 'db';
import { AppStateInitial } from 'model/store';
import { beginQuest } from 'controller/quest';

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

describe('Menus', () => {
  // enableConsole();
  // wrapper.debug();
  // console.log(wrapper.container.textContent);
  // disableConsole();

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

  test('Equipment Render', () => {
    const wrapper = render(
      <AppShim>
        <MenuEquipment onClose={() => void 0} player={getCurrentPlayer()} />
      </AppShim>
    );

    expect(wrapper.container.textContent).toMatch(/Party Member/);
    expect(wrapper.container.textContent).toMatch(/Ada/);
    expect(wrapper.container.textContent).toMatch(/Equipment/);
    expect(wrapper.container.textContent).toMatch(/Weapon/);
    expect(wrapper.container.textContent).toMatch(/Armor/);
    expect(wrapper.container.textContent).toMatch(/Accessory/);
  });

  test('Journal Render', () => {
    const scene = getCurrentScene();
    beginQuest(scene, 'TestQuest1');

    const wrapper = render(
      <AppShim
        state={{
          ...AppStateInitial,
          quest: {
            ...AppStateInitial.quest,
            questName: 'TestQuest1',
          },
        }}
      >
        <MenuJournal
          onClose={() => void 0}
          scene={getCurrentScene()}
          isInactive={false}
        />
      </AppShim>
    );

    expect(wrapper.container.textContent).toMatch(/Quest Name/);
    expect(wrapper.container.textContent).toMatch(/This is a test quest/);
  });

  test('Items Render', () => {
    playerAddItem(getCurrentPlayer(), 'RezGem');

    const wrapper = render(
      <AppShim>
        <MenuItems
          onClose={() => void 0}
          isInactive={false}
          player={getCurrentPlayer()}
        />
      </AppShim>
    );

    expect(wrapper.container.textContent).toMatch(/Respawn Gem/);
  });

  test('Positions Render', () => {
    const wrapper = render(
      <AppShim>
        <MenuPositions
          onClose={() => void 0}
          isInactive={false}
          player={getCurrentPlayer()}
        />
      </AppShim>
    );

    expect(wrapper.container.textContent).toMatch(/Ada/);
  });

  test('Load Render', () => {
    const wrapper = render(
      <AppShim>
        <MenuLoad onClose={() => void 0} />
      </AppShim>
    );

    expect(wrapper.container.textContent).toMatch(/Saved Games/);
  });
});
