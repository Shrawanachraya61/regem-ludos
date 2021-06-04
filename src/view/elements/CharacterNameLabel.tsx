/* @jsx h */
import { colors, style } from 'view/style';

const CharacterNameLabel = style('div', () => {
  return {
    fontSize: '18px',
    color: colors.BLACK,
    background: colors.WHITE,
    // boxShadow: BOX_SHADOW,
    borderTopLeftRadius: '8px',
    borderTopRightRadius: '8px',
    textTransform: 'uppercase',
    // border: `2px solid ${colors.BLACK}`,
    padding: '8px',
    marginBottom: '2px',
  };
});

export default CharacterNameLabel;
