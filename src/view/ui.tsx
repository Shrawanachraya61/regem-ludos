/* @jsx h */
import { h, render, Fragment } from 'preact';
import { useEffect, useState, useReducer } from 'preact/hooks';
import { colors, style } from 'view/style';

import { getCurrentPlayer, getCurrentScene, getIsPaused } from 'model/generics';
import { AppState, AppStateInitial, AppSection } from 'model/store';
import { appReducer } from 'controller/ui-actions';
import { getDrawScale, SCREEN_WIDTH, SCREEN_HEIGHT } from 'model/canvas';

// sections
import Debug from './components/Debug';
import BattleConclusion from './components/BattleConclusion';
// import BattleUISection from './components/BattleUISection';
import BattleSection from './components/BattleSection';
import CutsceneSection from './components/CutsceneSection';

import ArcadeCabinet from './components/ArcadeCabinet';
import CutsceneChoicesSection from './components/CutsceneSection/CutsceneChoicesSection';
import SettingsSection from './components/SettingsSection';
import ModalSection from './components/ModalSection';
import SaveSection from './components/SaveSection';
import MenuSection from './components/MenuSection';
import LevelUpSection from './components/LevelUpSection';

import { initiateBattle } from 'controller/battle-management';
import { get as getBattle } from 'db/encounters';
import { get as getQuest } from 'db/quests';
import QuestSection from './components/QuestSection';
import { questIsCompleted } from 'controller/quest';

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

  console.log('UI RENDER');

  const renderSection = (section: AppSection, key: number) => {
    switch (section) {
      case AppSection.BattleVictory: {
        return <BattleConclusion key={key} isVictory={true} />;
      }
      case AppSection.BattleDefeated: {
        return <BattleConclusion key={key} isVictory={false} />;
      }
      case AppSection.BattleUI: {
        return <BattleSection key={key} />;
      }
      case AppSection.Cutscene: {
        return <CutsceneSection key={key} />;
      }
      case AppSection.ArcadeCabinet: {
        return <ArcadeCabinet key={key} game={appState.arcadeGame.path} />;
      }
      case AppSection.Choices: {
        return <CutsceneChoicesSection key={key} />;
      }
      case AppSection.Settings: {
        return <SettingsSection key={key} />;
      }
      case AppSection.Modal: {
        return <ModalSection key={key} />;
      }
      case AppSection.Debug: {
        return <Debug />;
      }
      case AppSection.Save: {
        return <SaveSection key={key} />;
      }
      case AppSection.Menu: {
        // const battle = initiateBattle(
        //   getCurrentPlayer(),
        //   getBattle('ENCOUNTER_TUT_DUNGEON1')
        // );
        // battlePauseTimers(battle);
        // return <BattleConclusion key={key} isVictory={true} />;
        return <MenuSection key={key} />;
      }
      case AppSection.Quest: {
        const quest = getQuest(appState.quest.questName);
        return (
          <QuestSection
            key={key}
            quest={quest}
            onClose={appState.quest.onClose}
            status={
              questIsCompleted(getCurrentScene(), quest)
                ? 'completed'
                : 'started'
            }
          />
        );
      }
      case AppSection.LevelUp: {
        return <LevelUpSection key={key} />;
      }
      default: {
        return <div></div>;
      }
    }
  };

  const scale = getDrawScale();
  const width = SCREEN_WIDTH * (scale > 2 ? 2 : scale);
  const height = SCREEN_HEIGHT * (scale > 2 ? 2 : scale);
  const isPositionFixed =
    window.innerHeight < height || window.innerWidth < width;

  return (
    <div
      style={{
        position: isPositionFixed ? 'fixed' : 'absolute',
        top: '0px',
        left: '0px',
        width: isPositionFixed
          ? window.innerWidth
          : Math.min(width, window.innerWidth),
        height: Math.min(height, window.innerHeight),
      }}
    >
      <Root id="ui-sections">
        {getIsPaused() ? (
          <PausedOverlay>
            <PausedText>PAUSED</PausedText>
          </PausedOverlay>
        ) : null}
        {appState.sections.map(renderSection)}
        {appState.room.particles.map((p, i) => {
          const UiComponent: any = p.uiComponent;
          if (UiComponent) {
            return <UiComponent key={'particle-' + i} particle={p} />;
          } else {
            return <></>;
          }
        })}
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
    const parent = document.getElementById('canvas-area-parent');
    if (parent) {
      const scale = 2;
      parent.style['max-width'] = SCREEN_WIDTH * scale;
      parent.style['max-height'] = SCREEN_HEIGHT * scale;
    }

    render(<App />, dom);
  }
};
