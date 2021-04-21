import { colors, style, keyframes } from 'view/style';

export enum ButtonType {
  NEUTRAL,
  PRIMARY,
  SECONDARY,
  ENEMY,
  CANCEL,
  TOKEN,
}

interface IButtonProps {
  type: ButtonType;
  selected?: boolean;
  disabled?: boolean;
}

const ButtonTypeToColor = {
  [ButtonType.NEUTRAL]: { top: colors.GREY, bottom: colors.DARKGREY_ALT },
  [ButtonType.PRIMARY]: { top: colors.BLUE, bottom: colors.DARKBLUE },
  [ButtonType.SECONDARY]: { top: colors.GREEN, bottom: colors.DARKGREEN },
  [ButtonType.ENEMY]: { top: colors.RED, bottom: colors.DARKRED },
  [ButtonType.CANCEL]: { top: colors.RED, bottom: colors.DARKRED },
  [ButtonType.TOKEN]: { top: colors.ORANGE, bottom: colors.YELLOW },
};

const pulse = keyframes({
  '0%': {
    filter: 'brightness(100%)',
  },
  '50%': {
    filter: 'brightness(80%)',
  },
  '100%': {
    filter: 'brightness(100%)',
  },
});

const Button = style(
  'div',
  (props: IButtonProps = { type: ButtonType.NEUTRAL }) => ({
    fontSize: '16px',
    textAlign: 'center',
    padding: '2px 8px',
    cursor: props.disabled ? 'unset' : 'pointer',
    // border: props.disabled ? `1px solid ${colors.BLACK}` : 'unset',
    // background: props.disabled
    //   ? colors.BGGREY
    //   : `linear-gradient(${ButtonTypeToColor[props.type].top}, ${
    //       ButtonTypeToColor[props.type].bottom
    //     })`,
    background: ButtonTypeToColor[props.type].bottom,
    textDecoration: props.selected ? 'underline' : 'unset',
    // borderRadius: props.selected ? '8px 8px 0px 0px' : '8px 8px 8px 8px',
    transition: 'border-radius 250sm',
    border: `2px solid ${
      props.selected
        ? colors.WHITE
        : props.disabled
        ? colors.GREY
        : ButtonTypeToColor[props.type].top
    }`,
    borderBottom: `2px solid ${colors.GREY}`,
    filter: props.disabled ? 'brightness(80%)' : 'unset',
    minWidth: '80px',
    animation: props.selected ? `${pulse} 1500ms linear infinite` : 'unset',
    '&:hover': {
      filter: props.disabled ? 'unset' : 'brightness(120%)',
    },
    '&:active': {
      filter: props.disabled ? 'unset' : 'brightness(80%)',
      transform: 'translateY(2px)',
    },
  })
);

export default Button;
