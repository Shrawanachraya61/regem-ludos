import { h, render } from 'preact';
import { useEffect, useState, useReducer } from 'preact/hooks';
import { colors, style } from 'view/style';

import { getIsPaused } from 'model/generics';
import { AppState, AppStateInitial } from 'model/store';
import { appReducer } from 'controller/ui-actions';
import { getDrawScale } from 'model/canvas';

// sections
import Debug from './components/Debug';
import BattleConclusion from './components/BattleConclusion';
import BattleUISection from './components/BattleUISection';
import CutsceneSection from './components/CutsceneSection';

import { AppSection } from 'model/store';

interface UIInterface {
  appState: AppState;
  render: () => void;
  dispatch: (...args: any) => void;
}

const Root = style('div', {
  position: 'relative',
  height: '100%',
});

const PausedOverlay = style('div', () => ({
  position: 'absolute',
  left: '0',
  top: '0',
  background: 'black',
  opacity: '0.3',
  textAlign: 'center',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  color: colors.WHITE,
  fontSize: '24px',
  width: '100%',
  height: '100%',
  pointerEvents: 'none',
}));

const PausedText = style('div', () => ({
  marginBottom: '256px',
}));

export let uiInterface: UIInterface | null = null;
export const getUiInterface = () => uiInterface as UIInterface;

const App = () => {
  const [render, setRender] = useState(false);
  const [appState, dispatch] = useReducer(appReducer, AppStateInitial);
  useEffect(() => {
    uiInterface = (window as any).uiInterface = {
      appState,
      render: () => {
        setRender(!render);
      },
      dispatch,
    };
  });

  const renderSection = (section: AppSection, key: number) => {
    switch (section) {
      case AppSection.BattleVictory: {
        return <BattleConclusion key={key} isVictory={true} />;
      }
      case AppSection.BattleDefeated: {
        return <BattleConclusion key={key} isVictory={false} />;
      }
      case AppSection.BattleUI: {
        return <BattleUISection key={key} />;
      }
      case AppSection.Cutscene: {
        return <CutsceneSection key={key} />;
      }
      case AppSection.Debug: {
        return <Debug />;
      }
      default: {
        return <div></div>;
      }
    }
  };

  // console.log('render app', appState);
  const scale = getDrawScale();
  return (
    <div
      style={{
        position: 'absolute',
        top: '0px',
        width: 512 * (scale > 2 ? 2 : scale),
        height: 512 * (scale > 2 ? 2 : scale),
      }}
    >
      <Root>
        {getIsPaused() ? (
          <PausedOverlay>
            <PausedText>PAUSED</PausedText>
          </PausedOverlay>
        ) : null}
        {appState.sections.map(renderSection)}
      </Root>
    </div>
  );
};

export const renderUi = (): void => {
  if (uiInterface) {
    uiInterface.render();
  }
};

export const mountUi = () => {
  const dom = document.getElementById('ui');
  if (dom) {
    render(<App />, dom);
  }
};
