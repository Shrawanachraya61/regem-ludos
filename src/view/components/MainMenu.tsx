/* @jsx h */
import { h } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import MenuBox from 'view/elements/MenuBox';
import VerticalMenu from 'view/elements/VerticalMenu';
import { ConfirmModal } from './ModalSection/ModalSection';
import SettingsSection from './SettingsSection';
import MenuLoad from './MenuSection/MenuLoad';
import { getCancelKeyLabel } from 'controller/events';
import { CardSize, sizes as cardSizes } from 'view/elements/Card';
import { playSoundName } from 'model/sound';
import { getCurrentScene, setCurrentPlayer, setTimeLoaded } from 'model/generics';
import { getCanvas, setDrawScale } from 'model/canvas';
import { initHooks } from 'view/hooks';
import { get as getCharacter } from 'db/characters';
import { get as getOverworld } from 'db/overworlds';
import { playerCreateNew } from 'model/player';
import { characterCreateFromTemplate } from 'model/character';
import {
  enableOverworldControl,
  initiateOverworld,
} from 'controller/overworld-management';
import { renderUi } from 'view/ui';
import { runMainLoop } from 'controller/loop';
import { ISave, loadSavedGame } from 'controller/save-management';
import { beginQuest } from 'model/quest';

const setupGame = async () => {
  setTimeLoaded(+new Date());

  getCanvas(); // loads the canvas before the events so getBoundingClientRect works correctly
  setDrawScale(4);
  initHooks();

  // give ui 100ms to mount
  await new Promise<void>(resolve => {
    setTimeout(resolve, 100);
  });
};

const createNewGame = async () => {
  await setupGame();

  const adaTemplate = getCharacter('Ada');
  const player = playerCreateNew(adaTemplate);

  const conscience = characterCreateFromTemplate(getCharacter('Conscience'));
  player.party.push(conscience);
  player.partyStorage.push(conscience);
  player.battlePositions.push(conscience);

  beginQuest(getCurrentScene(), 'OpeningQuest');

  const overworldTemplate = getOverworld('floor1Outside');
  initiateOverworld(player, overworldTemplate);
  enableOverworldControl();

  runMainLoop();

  (document.getElementById('controls') as any).style.display = 'none';
  renderUi();
};

const MenuContent = (props: {
  activeSection: string | null;
  hideActiveSection: () => void;
  startGame: () => void;
  loadGame: (save: ISave) => void;
}) => {
  let cmpt = <div></div>;

  if (props.activeSection === 'new') {
    cmpt = (
      <div>
        <ConfirmModal
          onConfirm={() => {
            playSoundName('level_up');
            props.startGame();
          }}
          onClose={() => {
            props.hideActiveSection();
          }}
          body={<p>Do you wish to create a new game?</p>}
        />
      </div>
    );
  } else if (props.activeSection === 'settings') {
    cmpt = (
      <SettingsSection
        onClose={() => {
          props.hideActiveSection();
        }}
      />
    );
  } else if (props.activeSection === 'load') {
    cmpt = (
      <MenuBox
        title="Load"
        onClose={() => {
          props.hideActiveSection();
        }}
        maxWidth={cardSizes[CardSize.XLARGE].width}
        closeButtonLabel={'Back ' + getCancelKeyLabel()}
        disableKeyboardShortcut={true}
      >
        <MenuLoad
          onClose={() => {
            // playSoundName('menu_choice_close');
            props.hideActiveSection();
          }}
          onSaveClicked={(save: ISave) => {
            props.loadGame(save);
          }}
        />
      </MenuBox>
    );
  }

  return cmpt;
};

interface IMainMenuProps {
  squareCommands: {
    plus: () => void;
    plus2: () => void;
    plus3: () => void;
    logo: () => void;
    field: () => void;
    hide: (isNewGame: boolean) => Promise<void>;
  };
}

const MainMenu = (props: IMainMenuProps) => {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const ref: any = useRef();
  useEffect(() => {
    if (ref.current) {
      ref.current.style.opacity = '1';
    }
  }, [activeSection]);

  const hideActiveSection = () => {
    setActiveSection(null);
    playSoundName('menu_choice_close');
    props.squareCommands.logo();
  };

  const handleNewGame = async () => {
    setActiveSection('loading');
    await props.squareCommands.hide(true);
    createNewGame();
  };

  const handleLoadGame = async (save: ISave) => {
    setActiveSection('loading');
    await props.squareCommands.hide(false);
    await setupGame();
    loadSavedGame(save);
  };

  return (
    <div
      ref={ref}
      style={{
        opacity: '0',
        transition: 'opacity 300ms linear',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
        position: 'fixed',
        left: '0',
        top: '0',
        width: 'calc(100% - 37px)', // center the menu on the logo
        height: 'calc(100% - 64px)', // move the menu 64px from bottom
      }}
    >
      <MenuContent
        activeSection={activeSection}
        hideActiveSection={hideActiveSection}
        startGame={handleNewGame}
        loadGame={handleLoadGame}
      />
      <VerticalMenu
        title="MAKE YOUR SELECTION"
        width="256px"
        open={activeSection === null}
        isInactive={activeSection != null}
        items={[
          // {
          //   label: 'Continue',
          //   value: 'continue',
          // },
          {
            label: 'New Game',
            value: 'new',
          },
          {
            label: 'Load Game',
            value: 'load',
          },
          {
            label: 'Arcade Games',
            value: 'games',
          },
          {
            label: 'Settings',
            value: 'settings',
          },
        ]}
        onItemClickSound="menu_select"
        onItemClick={(val: string) => {
          console.log('clicked', val);
          if (val === 'new') {
            // playSoundName('menu_select');
            // props.squareCommands.field();
          } else if (val === 'load') {
            playSoundName('menu_choice_open');
            props.squareCommands.field();
          } else if (val === 'settings') {
            playSoundName('menu_choice_open');
            props.squareCommands.plus2();
          } else if (val === 'games') {
            // props.squareCommands.plus3();
            return;
          }
          setActiveSection(val);
        }}
      />
    </div>
  );
};

export default MainMenu;
