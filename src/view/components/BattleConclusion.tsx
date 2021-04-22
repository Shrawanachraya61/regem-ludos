/* @jsx h */
import { h } from 'preact';
import { colors, style } from 'view/style';
import Button, { ButtonType } from 'view/elements/Button';
import { getCurrentBattle } from 'model/generics';
import { BattleEvent, battleInvokeEvent } from 'model/battle';
import VerticalMenu from 'view/elements/VerticalMenu';
// import { Ver

interface IBattleConclusionProps {
  isVictory: boolean;
}

const Root = style('div', () => {
  return {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    height: '100%',
    fontSize: '4rem',
    color: colors.WHITE,
  };
});

const BattleSelectMenu = (props: IBattleConclusionProps): h.JSX.Element => {
  const handleContinueClick = () => {
    const battle = getCurrentBattle();
    if (battle) {
      battleInvokeEvent(battle, BattleEvent.onCompletion, battle);
    }
  };
  return (
    <Root>
      <span>{props.isVictory ? 'VICTORY!' : 'DEFEATED!'}</span>
      <VerticalMenu
        title="Choose"
        width="50%"
        open={true}
        hideTitle
        style={{
          transition: 'transform 0.15s',
          transform: 'scaleX(1)',
          width: '128px',
        }}
        items={[
          {
            label: (
              <div>
                <span>Continue</span>
              </div>
            ),
            value: 0,
          },
        ]}
        onItemClickSound="menu_select"
        onItemClick={handleContinueClick}
      />
      {/* <Button type={ButtonType.PRIMARY} onClick={handleContinueClick}>
        Continue
      </Button> */}
    </Root>
  );
};

export default BattleSelectMenu;
