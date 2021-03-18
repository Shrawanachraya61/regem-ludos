/* @jsx h */
import { getCurrentBattle } from 'model/generics';
import { h } from 'preact';
import { colors, style } from 'view/style';

interface IActionInfoTooltip {
  id?: string;
  children?: string;
  characterIndexSelected: number;
}

const Root = style('div', () => {
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
  };
});

const ActingWeaponPrimary = (props: IActionInfoTooltip) => {
  return <Root>{props.children}</Root>;
};

export default ActingWeaponPrimary;
