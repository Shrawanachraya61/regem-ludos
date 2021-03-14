/* @jsx h */
import { h } from 'preact';
import { colors, style } from 'view/style';

interface IBattleConclusionProps {
  isVictory: boolean;
}

const Root = style('div', () => {
  return {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    fontSize: '4rem',
    color: colors.WHITE,
  };
});

const BattleSelectMenu = (props: IBattleConclusionProps): h.JSX.Element => {
  return (
    <Root>
      <span>{props.isVictory ? 'VICTORY!' : 'DEFEATED!'}</span>
    </Root>
  );
};

export default BattleSelectMenu;
