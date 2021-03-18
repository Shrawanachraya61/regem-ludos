/* @jsx h */
import { getCurrentBattle, getIsPaused } from 'model/generics';
import { h } from 'preact';
import { style, colors } from 'view/style';
import { pause, unpause } from 'controller/loop';

import CharacterInfoCard from './CharacterInfoCard';
import EnemyInfoCard from './EnemyInfoCard';
import { getUiInterface } from 'view/ui';
import CharacterFollower from 'view/elements/CharacterFollower';

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
  };
});

const EnemyInfoCardsContainer = style('div', () => {
  return {
    position: 'absolute',
    top: '0px',
    right: '0px',
    width: 'calc(100% - 64px)',
    margin: '32px',
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
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
      {battle.allies.map(bCh => {
        return (
          <CharacterFollower
            ch={bCh.ch}
            renderKey={'follower-' + bCh.ch.name}
          ></CharacterFollower>
        );
      })}
    </Root>
  );
};

export default BattleSection;
