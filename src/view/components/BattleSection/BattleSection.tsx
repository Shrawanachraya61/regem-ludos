/* @jsx h */
import { getCurrentBattle, getIsPaused } from 'model/generics';
import { h } from 'preact';
import { style, colors, keyframes } from 'view/style';
import { pause, unpause } from 'controller/loop';

import CharacterInfoCard from './CharacterInfoCard';
import EnemyInfoCard from './EnemyInfoCard';
import { getUiInterface, renderUi } from 'view/ui';

import CharacterFollower from 'view/elements/CharacterFollower';
import { getDrawScale } from 'model/canvas';
import { Character } from 'model/character';
import {
  BattleAllegiance,
  BattleEvent,
  battleGetActingAllegiance,
  battleGetTargetedEnemy,
  battleSetEnemyTargetIndex,
} from 'model/battle';
import { useState } from 'lib/preact-hooks';
import { useBattleSubscription } from 'view/hooks';
import TargetIcon from 'view/icons/Target';
import ArmorIcon from 'view/icons/Armor';
import BattleCharacterFollower from './BattleCharacterFollower';

interface IBattleSectionProps {
  id?: string;
}

const Root = style('div', () => {
  return {
    position: 'absolute',
    top: '0px',
    left: '0px',
    overflow: 'hidden',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  };
});

const CharacterInfoCardsContainer = style('div', () => {
  return {
    position: 'absolute',
    bottom: '0px',
    left: '0px',
    width: 'calc(100% - 64px)',
    margin: '32px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-end',
    flexDirection: 'row-reverse',
    pointerEvents: 'all',
  };
});

const EnemyInfoCardsContainer = style('div', () => {
  return {
    position: 'absolute',
    top: '0px',
    right: '0px',
    width: 'calc(100% - 64px)',
    margin: '8px 32px',
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    pointerEvents: 'all',
  };
});

const UpperLeftContainer = style('div', () => {
  return {
    position: 'absolute',
    left: '0px',
    top: '0px',
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    pointerEvents: 'all',
  };
});

const PauseButton = style('div', () => {
  return {
    color: colors.WHITE,
    background: 'rgba(0, 0, 0, 0.5)',
    border: `2px solid ${colors.WHITE}`,
    padding: '32px',
    fontSize: '24px',
    borderRadius: '8px',
    textAlign: 'center',
    minWidth: '161px',
    cursor: 'pointer',
    pointerEvents: 'all',
    '&:hover': {
      filter: 'brightness(120%)',
    },
    '&:active': {
      filter: 'brightness(80%)',
    },
  };
});

const OptionsButton = style('div', () => {
  return {
    pointerEvents: 'all',
    color: colors.WHITE,
    background: 'rgba(0, 0, 0, 0.5)',
    border: `2px solid ${colors.WHITE}`,
    padding: '8px',
    fontSize: '16px',
    borderRadius: '8px',
    cursor: 'pointer',
    '&:hover': {
      filter: 'brightness(120%)',
    },
    '&:active': {
      filter: 'brightness(80%)',
    },
    marginLeft: '8px',
  };
});
const BattleSection = (props: IBattleSectionProps) => {
  const battle = getCurrentBattle();
  const uiState = getUiInterface().appState.battle;

  const isPaused = getIsPaused();

  const [currentlyActingAllegiance, setCurrentlyActingAllegiance] = useState(
    null
  );
  useBattleSubscription(
    getCurrentBattle(),
    BattleEvent.onTurnStarted,
    (allegiance: BattleAllegiance) => {
      console.log('turn started');
      setCurrentlyActingAllegiance(allegiance);
    }
  );
  useBattleSubscription(getCurrentBattle(), BattleEvent.onTurnEnded, () => {
    console.log('turn ended');
    setCurrentlyActingAllegiance(null);
  });

  const isPlayerActing = currentlyActingAllegiance === BattleAllegiance.ALLY;

  const clickPauseButton = () => {
    if (getIsPaused()) {
      unpause();
    } else {
      pause();
    }
  };

  return (
    <Root id="battle-section-root">
      <CharacterInfoCardsContainer id="ch-info-cards-ctr">
        {battle.allies.map((bCh, i) => {
          return (
            <CharacterInfoCard
              bCh={bCh}
              isSelected={uiState.characterIndexSelected === i && isPaused}
              characterIndex={i}
              key={bCh.ch.name}
              id={'ch-info-card-' + bCh.ch.name}
            />
          );
        })}
      </CharacterInfoCardsContainer>
      <EnemyInfoCardsContainer id="enemy-info-cards-ctr">
        {battle.enemies.map((bCh, i) => {
          return (
            <EnemyInfoCard
              bCh={bCh}
              isSelected={false && isPaused}
              characterIndex={i}
              key={bCh.ch.name}
              id={'ch-info-card-' + bCh.ch.name}
            />
          );
        })}
      </EnemyInfoCardsContainer>
      <UpperLeftContainer>
        <PauseButton onClick={clickPauseButton}>
          {isPaused ? 'Unpause' : 'Pause'}
        </PauseButton>
        <OptionsButton>Options</OptionsButton>
      </UpperLeftContainer>
      {battle.allies.map((bCh, i) => {
        return (
          <BattleCharacterFollower bCh={bCh} battleIndex={i} isEnemy={false} />
        );
      })}
      {battle.enemies.map((bCh, i) => {
        return (
          <BattleCharacterFollower bCh={bCh} battleIndex={i} isEnemy={true} />
        );
      })}
    </Root>
  );
};

export default BattleSection;
