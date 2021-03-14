/* @jsx h */
import { getCurrentBattle } from 'model/generics';
import { h } from 'preact';
import { style } from 'view/style';

import CharacterInfoCard from './CharacterInfoCard';

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
    width: '100%',
    margin: '32px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'bottom',
    flexDirection: 'row-reverse',
  };
});

const BattleSection = (props: IBattleSectionProps) => {
  const battle = getCurrentBattle();
  return (
    <Root id="battle-section-root">
      <CharacterInfoCardsContainer id="ch-info-cards-ctr">
        {battle.allies.map(bCh => {
          return (
            <CharacterInfoCard
              bCh={bCh}
              key={bCh.ch.name}
              id={'ch-info-card-' + bCh.ch.name}
            />
          );
        })}
      </CharacterInfoCardsContainer>
    </Root>
  );
};

export default BattleSection;
