import { h, Fragment } from 'preact';
import { style } from 'view/style';
import Button, { ButtonType } from 'view/elements/Button';
import { pause, unpause } from 'controller/loop';
import {
  getTriggersVisible,
  hideMarkers,
  hideTriggers,
  showMarkers,
  showTriggers,
} from 'model/generics';

const TopBarWrapper = style('div', {
  position: 'absolute',
  top: '0px',
  // width: '100%',
});

const ArcadeUISection = () => {
  return (
    <>
      <TopBarWrapper>
        <Button
          type={ButtonType.PRIMARY}
          onClick={() => {
            if (getTriggersVisible()) {
              hideTriggers();
              hideMarkers();
            } else {
              showTriggers();
              showMarkers();
            }
          }}
        >
          Toggle Debug
        </Button>
      </TopBarWrapper>
    </>
  );
};

export default ArcadeUISection;
