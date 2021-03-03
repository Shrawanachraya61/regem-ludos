import { colors, style, MEDIA_QUERY_PHONE_WIDTH } from 'view/style';

export enum ButtonType {
  PRIMARY,
  SECONDARY,
  CANCEL,
  TOKEN,
}

interface IButtonProps {
  type: ButtonType;
  disabled?: boolean;
}

const ButtonTypeToColor = {
  [ButtonType.PRIMARY]: colors.GREEN,
  [ButtonType.SECONDARY]: colors.GREY,
  [ButtonType.CANCEL]: colors.RED,
  [ButtonType.TOKEN]: colors.ORANGE,
};

const Button = style('div', (props: IButtonProps) => ({
  textAlign: 'center',
  borderRadius: '0.25rem',
  padding: '0.5rem',
  fontSize: '1rem',
  background: props.disabled ? colors.DARKGREY : ButtonTypeToColor[props.type],
  cursor: props.disabled ? 'default' : 'pointer',
  pointerEvents: props.disabled ? 'none' : 'all',
  '&:hover': {
    filter: props.disabled ? 'unset' : 'brightness(120%)',
  },
  '&:active': {
    filter: props.disabled ? 'unset' : 'brightness(80%)',
  },
  // [MEDIA_QUERY_PHONE_WIDTH]: {
  //   padding: '0.75rem',
  //   fontSize: '2rem',
  // },
}));

export default Button;
