/* @jsx h */
import { getCurrentBattle } from 'model/generics';
import { h } from 'preact';
import { colors, style } from 'view/style';

interface IActionInfoTooltip {
  id?: string;
  children?: string;
  characterIndexSelected: number;
}

const Root = style('div', (props: { placement: 'left' | 'right' }) => {
  return {
    color: colors.WHITE,
    border: `2px solid ${colors.WHITE}`,
    fontSize: '20px',
    position: 'absolute',
    padding: '8px',
    margin: '32px',
    bottom: '192px',
    width: '500px',
    background: 'rgba(0, 0, 0, 0.5)',
    pointerEvents: 'none',
    [props.placement]: '0px',
  };
});

const determinePlacement = (
  selectedCharacterIndex: number
): 'left' | 'right' => {
  const battle = getCurrentBattle();
  const allies = battle.allies;
  return selectedCharacterIndex >= allies.length / 2 ? 'right' : 'left';
};

// determinePlacement(0); // 0 >= 2 / 2 (1) : false : left
// determinePlacement(1); // 1 >= 2 / 2 (1) : true : right
// determinePlacement(0); // 0 >= 3 / 2 (1.5) : false : left
// determinePlacement(1); // 1 >= 3 / 2 (1.5) : false : left
// determinePlacement(2); // 2 >= 3 / 2 (1.5) : true : right

const ActionInfoTooltip = (props: IActionInfoTooltip) => {
  return (
    <Root placement={determinePlacement(props.characterIndexSelected)}>
      {props.children}
    </Root>
  );
};

export default ActionInfoTooltip;
