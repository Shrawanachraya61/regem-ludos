/* @jsx h */
import { h, Fragment } from 'preact';
import { colors, style } from 'view/style';
import { showModal, showSection } from 'controller/ui-actions';
import { AppSection, ModalSection } from 'model/store';
import Card, { CardSize } from 'view/elements/Card';
import { pause, unpause } from 'controller/loop';
import {
  popKeyHandler,
  isCancelKey,
  isAuxKey,
  getCancelKeyLabel,
  getAuxKeyLabel,
} from 'controller/events';
import { useEffect, useState, useCallback } from 'preact/hooks';
import { getUiInterface } from 'view/ui';
import { playSoundName } from 'model/sound';
import {
  createSave,
  deleteSave,
  saveGame,
  loadSaveListFromLS,
  ISave,
} from 'controller/save-management';
import VerticalMenu from 'view/elements/VerticalMenu';
import StaticAnimDiv from 'view/elements/StaticAnimDiv';
import { sceneStopWaitingUntil } from 'model/scene';
import { getCurrentScene } from 'model/generics';
import Button, { ButtonType } from 'view/elements/Button';
import { useInputEventStack } from 'view/hooks';
import { playSound } from 'controller/scene/scene-commands';
import SaveGameListItem from 'view/components/SaveGameListItem';

const MAX_SAVES = 4;

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

const ConfirmButton = style('div', () => {
  return {
    background: colors.DARKGREEN,
    border: '1px solid ' + colors.WHITE,
    borderRadius: '26px',
    padding: '4px',
  };
});

const SaveSection = () => {
  const [saves, setSaves] = useState(loadSaveListFromLS()) as [
    ISave[],
    (saves: ISave[]) => void
  ];
  const [modalVisible, setModalVisible] = useState(false);

  const handleCreateClick = () => {
    console.log('CREATE SAVE GAME');
    playSoundName('menu_sparkle');
    setModalVisible(true);
    saveGame(saves.length);
    showModal(ModalSection.INFO, {
      onClose: () => {
        setModalVisible(false);
        setSaves(loadSaveListFromLS());
      },
      body: 'Save created!',
    });
  };
  const handleSaveClick = (saveIndex: number) => {
    if (saveIndex >= saves.length) {
      handleCreateClick();
      return;
    }
    console.log('SAVE GAME', saveIndex);
    playSoundName('menu_choice_open');
    setModalVisible(true);
    showModal(ModalSection.CONFIRM, {
      onClose: () => {
        setModalVisible(false);
      },
      onConfirm: () => {
        playSoundName('menu_sparkle');
        saveGame(saveIndex);
        showModal(ModalSection.INFO, {
          onClose: () => {
            setModalVisible(false);
            setSaves(loadSaveListFromLS());
            pause();
          },
          body: 'Save created!',
        });
      },
      body: 'Are you sure you wish to overwrite this save file?',
    });
  };
  const handleDeleteClick = (saveIndex: number) => {
    console.log('DELETE GAME', saveIndex);
    playSoundName('menu_choice_open');
    setModalVisible(true);
    showModal(ModalSection.CONFIRM, {
      onClose: () => {
        setModalVisible(false);
      },
      onConfirm: () => {
        playSoundName('menu_cancel');
        deleteSave(saveIndex);
        showModal(ModalSection.INFO, {
          onClose: () => {
            setModalVisible(false);
            setSaves(loadSaveListFromLS());
          },
          body: 'Save deleted!',
        });
      },
      danger: true,
      body: 'Are you sure you wish to delete this save file?',
    });
  };

  const handleCloseClick = () => {
    const onClose = getUiInterface().appState.save.onClose;
    playSoundName('menu_select');
    onClose();
  };

  useInputEventStack(ev => {
    if (isCancelKey(ev.key)) {
      handleCloseClick();
    }
  });

  return (
    <>
      <Root>
        <Card size={CardSize.LARGE}>
          <ContentSpacer id="save-spacer">
            <VerticalMenu
              title="Saves"
              width="100%"
              open={true}
              isInactive={modalVisible}
              items={saves
                .map((save: ISave, i: number) => {
                  return {
                    label: (
                      <SaveGameListItem
                        save={save}
                        i={i}
                        handleDeleteClick={i => handleDeleteClick(i)}
                      />
                    ),
                    value: i,
                  };
                })
                .concat(
                  saves.length < MAX_SAVES
                    ? [
                        {
                          label: (
                            // <SaveFile color={colors.DARKBLUE} padding={'8px'}>
                            <ConfirmButton>+ New Save</ConfirmButton>
                            // </SaveFile>
                          ),
                          value: saves.length,
                        },
                      ]
                    : []
                )}
              onItemClickSound="menu_select"
              onItemClick={handleSaveClick}
              onAuxClickSound="menu_select"
              onAuxClick={handleDeleteClick}
            />
            <ConfirmButtonArea>
              <Button type={ButtonType.PRIMARY} onClick={handleCloseClick}>
                Close {getCancelKeyLabel()}
              </Button>
            </ConfirmButtonArea>
          </ContentSpacer>
        </Card>
      </Root>
    </>
  );
};

export default SaveSection;
