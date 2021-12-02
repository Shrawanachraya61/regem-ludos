/* @jsx h */
import { h, Fragment } from 'preact';
import { colors, style } from 'view/style';
import Button, {
  ButtonType,
  ButtonContentWithIcon,
} from 'view/elements/Button';
import { pause } from 'controller/loop';
import {
  getIsPaused,
  getTriggersVisible,
  hideMarkers,
  hideTriggers,
  setShowOnScreenControls,
  shouldShowOnScreenControls,
  showMarkers,
  showTriggers,
} from 'model/generics';
import { showSection, showSettings, showMenu } from 'controller/ui-actions';
import { AppSection } from 'model/store';
import {
  getAuxKeyLabel,
  getCancelKeyLabel,
  getConfirmKeyLabel,
  getPauseKeyLabel,
  pushEmptyKeyHandler,
} from 'controller/events';
import { getUiInterface, uiInterface } from 'view/ui';
import { playSound } from 'controller/scene/scene-commands';
import { playSoundName } from 'model/sound';
import GearIcon from 'view/icons/Gear';
import MenuIcon from 'view/icons/Menu';
import TalkIcon from 'view/icons/Talk';

const TopBarWrapper = style('div', {
  position: 'absolute',
  top: '4px',
  left: '4px',
  width: '100%',
  display: 'flex',
  pointerEvents: 'none',
  zIndex: 1,
  '& > div': {
    marginRight: '4px',
  },
});

export enum TopBarButtons {
  SETTINGS = 'settings',
  DEBUG = 'debug',
  MENU = 'menu',
  BATTLE_MENU = 'battle-menu',
  ON_SCREEN_CONTROLS = 'on-screen-controls',
  SKIP_CUTSCENE = 'skip',
}

interface ITopBarProps {
  onSettingsClose?: () => void;
  onSettingsClick?: () => void;
  onMenuClose?: () => void;
  onMenuClick?: () => void;
  onSkipClick?: () => void;
  buttons: (TopBarButtons | undefined)[];
  disabled?: boolean;
}

const TopBar = (props: ITopBarProps) => {
  const handleMenuClick = (ev: Event) => {
    ev.stopPropagation();
    playSoundName('menu_select');
    if (props.onMenuClose && props.onMenuClick) {
      showMenu(props.onMenuClose);
      props.onMenuClick();
    }
  };

  const handleSettingsClick = (ev: Event) => {
    ev.stopPropagation();
    playSoundName('menu_select');
    if (props.onSettingsClose && props.onSettingsClick) {
      showSettings(props.onSettingsClose);
      props.onSettingsClick();
    }
  };

  const handleSkipClick = () => {
    if (props.onSkipClick) {
      props.onSkipClick();
    }
  };

  const handleToggleDebug = (ev: Event) => {
    ev.stopPropagation();
    playSoundName('menu_select');
    if (getTriggersVisible()) {
      hideTriggers();
      hideMarkers();
    } else {
      showTriggers();
      showMarkers();
    }
  };

  const handleToggleOnScreenControls = (ev: Event) => {
    ev.stopPropagation();
    playSoundName('menu_select');
    if (shouldShowOnScreenControls()) {
      setShowOnScreenControls(false);
    } else {
      setShowOnScreenControls(true);
    }
    uiInterface?.render();
  };

  const buttonStyle: Record<string, string> = {};
  if (!props.disabled) {
    buttonStyle.pointerEvents = 'all';
  }

  return (
    <>
      <TopBarWrapper>
        {props.buttons.includes(TopBarButtons.MENU) ? (
          <Button
            id="top-bar-menu"
            disabled={props.disabled}
            style={buttonStyle}
            type={ButtonType.PRIMARY}
            onClick={handleMenuClick}
          >
            <ButtonContentWithIcon>
              <MenuIcon color={colors.WHITE} />
              Menu {getCancelKeyLabel()}
            </ButtonContentWithIcon>
          </Button>
        ) : null}
        {props.buttons.includes(TopBarButtons.BATTLE_MENU) ? (
          <Button
            id="top-bar-menu"
            disabled={props.disabled}
            style={buttonStyle}
            type={ButtonType.PRIMARY}
            onClick={props.onMenuClick}
          >
            <ButtonContentWithIcon>
              <MenuIcon color={colors.WHITE} />
              Menu {getPauseKeyLabel()}
            </ButtonContentWithIcon>
          </Button>
        ) : null}
        {props.buttons.includes(TopBarButtons.SETTINGS) ? (
          <Button
            disabled={props.disabled}
            style={buttonStyle}
            type={ButtonType.PRIMARY}
            onClick={handleSettingsClick}
          >
            <ButtonContentWithIcon>
              <GearIcon color={colors.WHITE} />
              Settings {getAuxKeyLabel()}
            </ButtonContentWithIcon>
          </Button>
        ) : null}
        {props.buttons.includes(TopBarButtons.SKIP_CUTSCENE) ? (
          <Button
            disabled={props.disabled || !props.onSkipClick}
            style={buttonStyle}
            type={ButtonType.SECONDARY}
            onClick={handleSkipClick}
          >
            <ButtonContentWithIcon>
              <TalkIcon color={colors.WHITE} />
              Skip (Backspace)
            </ButtonContentWithIcon>
          </Button>
        ) : null}
        {props.buttons.includes(TopBarButtons.DEBUG) ? (
          <Button
            disabled={props.disabled}
            style={buttonStyle}
            type={ButtonType.SECONDARY}
            onClick={handleToggleDebug}
          >
            Toggle Debug (d)
          </Button>
        ) : null}
        {props.buttons.includes(TopBarButtons.ON_SCREEN_CONTROLS) ? (
          <Button
            disabled={props.disabled}
            style={buttonStyle}
            type={ButtonType.SECONDARY}
            onClick={handleToggleOnScreenControls}
          >
            Toggle Controls
          </Button>
        ) : null}
      </TopBarWrapper>
    </>
  );
};

export default TopBar;
