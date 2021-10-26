/* @jsx h */
import { h, Fragment } from 'preact';
import { style } from 'view/style';
import { hideSection, showModal } from 'controller/ui-actions';
import { AppSection, ModalSection } from 'model/store';
import Card, { CardSize } from 'view/elements/Card';
import { pause, unpause } from 'controller/loop';
import { isCancelKey, getCancelKeyLabel } from 'controller/events';
import { useState } from 'preact/hooks';
import { playSoundName } from 'model/sound';
import {
  saveGame,
  loadSaveListFromLS,
  ISave,
  loadSavedGame,
} from 'controller/save-management';
import VerticalMenu from 'view/elements/VerticalMenu';
import Button, { ButtonType } from 'view/elements/Button';
import { useInputEventStack, useKeyboardEventListener } from 'view/hooks';
import SaveGameListItem from '../SaveGameListItem';
import { fadeIn, fadeOut } from 'controller/scene-commands';

const Root = style('div', {
  position: 'absolute',
  top: '0px',
  width: '100%',
  height: '100%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  background: 'rgba(0, 0, 0, 0.5)',
});

const ContentSpacer = style('div', {
  display: 'flex',
  justifyContent: 'space-between',
  flexDirection: 'column',
  alignItems: 'center',
  height: '100%',
});

const ConfirmButtonArea = style('div', {
  display: 'flex',
  justifyContent: 'center',
  padding: '8px',
});

interface ILoadSectionProps {
  onClose: () => void;
  onSaveClicked?: (save: ISave) => void;
}

const LoadSection = (props: ILoadSectionProps) => {
  const [saves] = useState(loadSaveListFromLS()) as [
    ISave[],
    (saves: ISave[]) => void
  ];
  const [modalVisible, setModalVisible] = useState(false);

  const handleLoadClick = (saveIndex: number) => {
    console.log('LOAD GAME', saveIndex);
    if (props.onSaveClicked) {
      props.onSaveClicked(saves[saveIndex]);
    } else {
      hideSection(AppSection.Menu);
      handleCloseClick();
      playSoundName('menu_choice_open');
      fadeOut(500, true);
      setTimeout(() => {
        loadSavedGame(saves[saveIndex]);
        // loadGame(saves[saveIndex]);
        fadeIn(500, true);
      }, 500);
    }
  };
  const handleCloseClick = () => {
    // const onClose = getUiInterface().appState.save.onClose;
    // playSoundName('menu_choice_close');
    // onClose();
    props.onClose();
  };

  useKeyboardEventListener(ev => {
    if (isCancelKey(ev.key)) {
      handleCloseClick();
    }
  });

  return (
    <Card size={CardSize.LARGE}>
      <ContentSpacer id="save-spacer">
        <VerticalMenu
          title="Saved Games"
          width="100%"
          open={true}
          isInactive={modalVisible}
          items={saves.map((save: ISave, i: number) => {
            return {
              label: <SaveGameListItem save={save} i={i} />,
              value: i,
            };
          })}
          onItemClickSound="menu_select"
          onItemClick={handleLoadClick}
        />
      </ContentSpacer>
    </Card>
  );
};

export default LoadSection;
