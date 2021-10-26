import { h } from 'preact';
import { render } from '@testing-library/preact';
import { useState, useReducer } from 'preact/hooks';

import { AppStateInitial } from '../../src/model/store';
import { appReducer } from 'controller/ui-actions';
import { setUiInterface } from 'view/ui';
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

import MenuMain from 'view/components/MenuSection/MenuMain';
import { sceneCreate } from 'model/scene';
import initDb from 'db';
import MenuStatus from 'view/components/MenuSection/MenuStatus';

const AppShim = props => {
  const [render, setRender] = useState(false);
  const [appState, dispatch] = useReducer(appReducer, AppStateInitial);
  setUiInterface(
    ((window as any).uiInterface = {
      appState,
      render: () => {
        setRender(!render);
      },
      dispatch,
    })
  );

  return <div id="app-root">{props.children}</div>;
};

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
