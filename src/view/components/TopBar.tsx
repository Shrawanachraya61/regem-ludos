/* @jsx h */
import { h, Fragment } from 'preact';
import { style } from 'view/style';
import Button, { ButtonType } from 'view/elements/Button';
import { pause } from 'controller/loop';
import {
  getIsPaused,
  getTriggersVisible,
  hideMarkers,
  hideTriggers,
  showMarkers,
  showTriggers,
} from 'model/generics';
import { showSection, showSettings } from 'controller/ui-actions';
import { AppSection } from 'model/store';
import { pushEmptyKeyHandler } from 'controller/events';
import { getUiInterface } from 'view/ui';
import { playSound } from 'controller/scene-commands';
import { playSoundName } from 'model/sound';

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
}

interface ITopBarProps {
  onSettingsClose: () => void;
  onSettingsClick: () => void;
  buttons: TopBarButtons[];
}

const TopBar = (props: ITopBarProps) => {
  const handleSettingsClick = (ev: Event) => {
    ev.stopPropagation();
    playSoundName('menu_select');
    showSettings(props.onSettingsClose);
    props.onSettingsClick();
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
        {props.buttons.includes(TopBarButtons.SETTINGS) ? (
          <Button type={ButtonType.PRIMARY} onClick={handleSettingsClick}>
            Settings
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
