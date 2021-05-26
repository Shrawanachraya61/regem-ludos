/* @jsx h */
import { h, Fragment } from 'preact';
import { colors, style } from 'view/style';
import { showModal, showSection } from 'controller/ui-actions';
import { AppSection, ModalSection } from 'model/store';
import Card, { CardSize } from 'view/elements/Card';
import { unpause } from 'controller/loop';
import { popKeyHandler, isCancelKey, isAuxKey } from 'controller/events';
import { useEffect, useState, useCallback } from 'lib/preact-hooks';
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
import { playSound } from 'controller/scene-commands';

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

const SaveFile = style('div', (props: { color?: string; padding?: string }) => {
  return {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '64px',
    background: props.color ?? 'unset',
    padding: props.padding ?? 'unset',
    boxSizing: 'border-box',
    border: props.color ? `2px solid ${colors.DARKGREEN}` : 'unset',
  };
});

const SaveFileMain = style('div', () => {
  return {
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
    '& > div': {
      marginRight: '4px',
    },
  };
});

const PortraitContainer = style('div', () => {
  return {
    background: colors.DARKGREY,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderRight: '2px solid ' + colors.BLACK,
    width: '64',
    height: '64',
    cursor: 'pointer',
    overflow: 'hidden',
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
      text: 'Save created!',
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
          },
          text: 'Save created!',
        });
      },
      text: 'Are you sure you wish to overwrite this save file?',
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
          text: 'Save deleted!',
        });
      },
      text: 'Are you sure you wish to delete this save file?',
    });
  };

  const handleCloseClick = () => {
    const onClose = getUiInterface().appState.save.onClose;
    playSoundName('menu_choice_close');
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
          <ContentSpacer id="settings-spacer">
            <VerticalMenu
              title="Saves"
              width="100%"
              open={true}
              isInactive={modalVisible}
              items={saves
                .map((save: ISave, i: number) => {
                  return {
                    label: (
                      <SaveFile>
                        <SaveFileMain>
                          <PortraitContainer>
                            <StaticAnimDiv
                              style={{ width: '128' }}
                              animName={'ada_portrait'}
                            ></StaticAnimDiv>
                          </PortraitContainer>
                          Duration: {save.durationPlayed}
                        </SaveFileMain>
                        <Button
                          style={{
                            minWidth: 'unset',
                            fontSize: '12px',
                          }}
                          type={ButtonType.CANCEL}
                          onClick={ev => {
                            ev.stopPropagation();
                            ev.preventDefault();
                            handleDeleteClick(i);
                          }}
                        >
                          Delete
                        </Button>
                      </SaveFile>
                    ),
                    value: i,
                  };
                })
                .concat(
                  saves.length < MAX_SAVES
                    ? [
                        {
                          label: (
                            <SaveFile color={colors.DARKBLUE} padding={'8px'}>
                              + New Save
                            </SaveFile>
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
                Close
              </Button>
            </ConfirmButtonArea>
          </ContentSpacer>
        </Card>
      </Root>
    </>
  );
};

export default SaveSection;
