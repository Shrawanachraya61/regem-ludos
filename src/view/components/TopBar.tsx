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
  showMarkers,
  showTriggers,
} from 'model/generics';
import { showSection, showSettings, showMenu } from 'controller/ui-actions';
import { AppSection } from 'model/store';
import { pushEmptyKeyHandler } from 'controller/events';
import { getUiInterface } from 'view/ui';
import { playSound } from 'controller/scene-commands';
import { playSoundName } from 'model/sound';
import GearIcon from 'view/icons/Gear';
import MenuIcon from 'view/icons/Menu';

const TopBarWrapper = style('div', {
  position: 'absolute',
  top: '0px',
  width: '100%',
  display: 'flex',
  zIndex: 1,
  '& > div': {
    marginRight: '4px',
  },
});

export enum TopBarButtons {
  SETTINGS = 'settings',
  DEBUG = 'debug',
  MENU = 'menu',
}

interface ITopBarProps {
  onSettingsClose?: () => void;
  onSettingsClick?: () => void;
  onMenuClose?: () => void;
  onMenuClick?: () => void;
  buttons: TopBarButtons[];
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

  return (
    <>
      <TopBarWrapper>
        {props.buttons.includes(TopBarButtons.MENU) ? (
          <Button type={ButtonType.PRIMARY} onClick={handleMenuClick}>
            <ButtonContentWithIcon>
              <MenuIcon color={colors.WHITE} />
              Menu
            </ButtonContentWithIcon>
          </Button>
        ) : null}
        {props.buttons.includes(TopBarButtons.SETTINGS) ? (
          <Button type={ButtonType.PRIMARY} onClick={handleSettingsClick}>
            <ButtonContentWithIcon>
              <GearIcon color={colors.WHITE} />
              Settings
            </ButtonContentWithIcon>
          </Button>
        ) : null}
        {props.buttons.includes(TopBarButtons.DEBUG) ? (
          <Button type={ButtonType.SECONDARY} onClick={handleToggleDebug}>
            Toggle Debug
          </Button>
        ) : null}
      </TopBarWrapper>
    </>
  );
};

export default TopBar;
