/* @jsx h */
import { h, Fragment } from 'preact';
import { colors, style } from 'view/style';
import Button, { ButtonType } from 'view/elements/Button';
import { pause, unpause } from 'controller/loop';
import {
  getCurrentPlayer,
  getIsPaused,
  getTriggersVisible,
  hideMarkers,
  hideTriggers,
  isDebugModeEnabled,
  setKeyDown,
  setKeyUp,
  shouldShowOnScreenControls,
  showMarkers,
  showTriggers,
} from 'model/generics';
import { showSection } from 'controller/ui-actions';
import { AppSection } from 'model/store';
import {
  getConfirmKey,
  getCancelKey,
  getCurrentKeyHandler,
  pushEmptyKeyHandler,
} from 'controller/events';
import CharacterFollower from 'view/elements/CharacterFollower';
import { getUiInterface } from 'view/ui';
import TopBar, { TopBarButtons } from './TopBar';
import { hexToRGBA } from 'utils';

const TopBarWrapper = style('div', {
  position: 'absolute',
  top: '0px',
  width: '100%',
  display: 'flex',
  '& > div': {
    marginRight: '4px',
  },
});

const CharacterText = style('div', (props: { visible: boolean }) => {
  return {
    background: 'rgba(0, 0, 0, 0.3)',
    padding: '4px',
    fontSize: '24px',
    color: colors.WHITE,
    width: '100%',
    textAlign: 'center',
    position: 'absolute',
    top: '256px',
    left: '0px',
    opacity: props.visible ? '1' : '0',
    transform: props.visible ? 'scaleY(1)' : 'scaleY(0)',
    transition: 'opacity 100ms, transform 100ms',
  };
});

const ActionButtonsArea = style('div', () => {
  return {
    position: 'absolute',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    right: '0px',
    bottom: '0px',
    margin: '4px',
    pointerEvents: 'all',
  };
});

const ActionButton = style(
  'div',
  (props: { margin: string; rotated?: boolean }) => {
    return {
      userSelect: 'none',
      color: colors.WHITE,
      background: 'rgba(0, 0, 0, 0.5)',
      fontSize: '24px',
      borderRadius: '100px',
      padding: '24px',
      border: '2px solid rgba(0, 0, 0, 0.25)',
      margin: `0px ${props.margin}`,
      cursor: 'pointer',
      transform: props.rotated ? 'rotate(-45deg)' : 'unset',
      '&:hover': {
        filter: 'brightness(120%)',
        background: 'rgba(0, 0, 0, 0.7)',
      },
      '&:active': {
        filter: 'brightness(80%)',
        background: 'rgba(0, 0, 0, 0.35)',
      },
    };
  }
);

const DirectionButtonsArea = style('div', () => {
  return {
    position: 'absolute',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    left: '24px',
    bottom: '24px',
    margin: '4px',
    pointerEvents: 'all',
    transform: 'rotate(45deg)',
    width: '166px',
  };
});

const NotificationWrapper = style('div', (props: { visible: boolean }) => {
  return {
    position: 'absolute',
    right: '0px',
    top: '0px',
    fontSize: '24px',
    padding: '16px',
    background: hexToRGBA(colors.DARKBLUE, 0.75),
    margin: '8px',
    maxWidth: '35%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    border: '2px solid ' + colors.WHITE,
    borderBottomColor: colors.BLUE,
    transition: props.visible ? 'transform 100ms ease-out' : 'unset',
    transform: props.visible ? 'translateX(0px)' : 'translateX(500px)',
  };
});

export const buttonHandlers = (cb: (ev: Event, isDown: boolean) => void) => {
  return {
    onMouseDown: (ev: Event) => {
      cb(ev, true);
    },
    onMouseUp: (ev: Event) => {
      cb(ev, false);
    },
    onTouchStart: (ev: Event) => {
      cb(ev, true);
    },
    onTouchEnd: (ev: Event) => {
      cb(ev, false);
    },
  };
};

const OverworldSection = () => {
  const overworldState = getUiInterface()?.appState.overworld;
  const notifications = getUiInterface()?.appState.notifications;

  if (!overworldState) {
    return <div></div>;
  }

  const createControlButtonClickHandler = (key: string) => (
    ev: Event,
    isDown: boolean
  ) => {
    ev.preventDefault();
    ev.stopImmediatePropagation();
    if (isDown) {
      setKeyDown(key);
    } else {
      setKeyUp(key);
    }
    const handler = getCurrentKeyHandler();
    if (handler) {
      handler({ key } as any);
    }
  };

  return (
    <>
      <TopBarWrapper>
        {!overworldState.interfaceDisabled ? (
          <TopBar
            buttons={[
              TopBarButtons.MENU,
              TopBarButtons.SETTINGS,
              isDebugModeEnabled() ? TopBarButtons.DEBUG : undefined,
              TopBarButtons.ON_SCREEN_CONTROLS,
            ]}
            onMenuClick={() => {
              pause();
            }}
            onMenuClose={() => {
              unpause();
              showSection(AppSection.Debug, true);
            }}
            onSettingsClick={() => {
              pause();
            }}
            onSettingsClose={() => {
              unpause();
              showSection(AppSection.Debug, true);
            }}
          />
        ) : null}
        <CharacterText visible={overworldState.characterText !== ''}>
          {overworldState.characterText || overworldState.prevCharacterText}
        </CharacterText>
        <NotificationWrapper visible={notifications.length > 0}>
          {notifications.map((n, i) => {
            return <p key={i}>{n.text}</p>;
          })}
        </NotificationWrapper>
      </TopBarWrapper>
      {shouldShowOnScreenControls() && !overworldState.interfaceDisabled ? (
        <>
          <ActionButtonsArea>
            <ActionButton
              margin="4px"
              {...buttonHandlers(
                createControlButtonClickHandler(getCancelKey())
              )}
            >
              Menu
            </ActionButton>
            <ActionButton
              margin="4px"
              {...buttonHandlers(
                createControlButtonClickHandler(getConfirmKey())
              )}
            >
              Action
            </ActionButton>
          </ActionButtonsArea>
          <DirectionButtonsArea>
            <ActionButton
              margin="1px"
              rotated
              {...buttonHandlers(createControlButtonClickHandler('ArrowUp'))}
            >
              Up
            </ActionButton>
            <ActionButton
              margin="1px"
              rotated
              {...buttonHandlers(createControlButtonClickHandler('ArrowRight'))}
            >
              Rt
            </ActionButton>
            <ActionButton
              margin="1px"
              rotated
              {...buttonHandlers(createControlButtonClickHandler('ArrowLeft'))}
            >
              Lf
            </ActionButton>
            <ActionButton
              margin="1px"
              rotated
              {...buttonHandlers(createControlButtonClickHandler('ArrowDown'))}
            >
              Dn
            </ActionButton>
          </DirectionButtonsArea>
        </>
      ) : null}
    </>
  );
};

export default OverworldSection;
