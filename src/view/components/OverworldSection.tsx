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
  showMarkers,
  showTriggers,
} from 'model/generics';
import { showSection } from 'controller/ui-actions';
import { AppSection } from 'model/store';
import { pushEmptyKeyHandler } from 'controller/events';
import CharacterFollower from 'view/elements/CharacterFollower';
import { getUiInterface } from 'view/ui';
import TopBar, { TopBarButtons } from './TopBar';

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

const OverworldSection = () => {
  const overworldState = getUiInterface()?.appState.overworld;

  if (!overworldState) {
    return <div></div>;
  }

  return (
    <>
      <TopBarWrapper>
        <TopBar
          buttons={[
            TopBarButtons.MENU,
            TopBarButtons.SETTINGS,
            TopBarButtons.DEBUG,
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
        <CharacterText visible={overworldState.characterText !== ''}>
          {overworldState.characterText || overworldState.prevCharacterText}
        </CharacterText>
      </TopBarWrapper>
    </>
  );
};

export default OverworldSection;
