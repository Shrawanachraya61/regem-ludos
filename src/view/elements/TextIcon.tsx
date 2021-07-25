import { style } from 'view/style';

const TextIcon = style('div', () => {
  return {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    '& > svg': {
      marginRight: '8px',
      width: '16px',
      height: '16px',
    },
  };
});

export default TextIcon;
