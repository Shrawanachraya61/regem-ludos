/* @jsx h */
import { h, Fragment } from 'preact';
import { style } from 'view/style';
import Button, { ButtonType } from 'view/elements/Button';
import { pause, unpause } from 'controller/loop';
import {
  getIsPaused,
  getTriggersVisible,
  hideMarkers,
  hideTriggers,
  showMarkers,
  showTriggers,
} from 'model/generics';
import { showSection } from 'controller/ui-actions';
import { AppSection } from 'model/store';
import { pushEmptyKeyHandler } from 'controller/events';

const TopBarWrapper = style('div', {
  position: 'absolute',
  top: '0px',
  width: '100%',
  display: 'flex',
  '& > div': {
    marginRight: '4px',
  },
});

const ArcadeUISection = () => {
  const handleSettingsClick = () => {
    showSection(AppSection.Settings, true);
    pushEmptyKeyHandler();
    if (!getIsPaused()) {
      pause();
    }
  };

  const handleToggleDebug = () => {
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
        <Button type={ButtonType.PRIMARY} onClick={handleSettingsClick}>
          Settings
        </Button>
        <Button type={ButtonType.PRIMARY} onClick={handleToggleDebug}>
          Toggle Debug
        </Button>
      </TopBarWrapper>
    </>
  );
};

export default ArcadeUISection;
