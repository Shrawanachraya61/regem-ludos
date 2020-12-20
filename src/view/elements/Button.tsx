import { colors, style, MEDIA_QUERY_PHONE_WIDTH } from 'view/style';

export enum ButtonType {
  PRIMARY,
  SECONDARY,
  CANCEL,
}

interface IButtonProps {
  type: ButtonType;
}

const ButtonTypeToColor = {
  [ButtonType.PRIMARY]: colors.GREEN,
  [ButtonType.SECONDARY]: colors.GREY,
  [ButtonType.CANCEL]: colors.RED,
};

const Button = style('div', (props: IButtonProps) => ({
  textAlign: 'center',
  borderRadius: '0.25rem',
  padding: '0.5rem',
  fontSize: '1rem',
  background: ButtonTypeToColor[props.type],
  cursor: 'pointer',
  '&:hover': {
    filter: 'brightness(120%)',
  },
  '&:active': {
    filter: 'brightness(80%)',
  },
  [MEDIA_QUERY_PHONE_WIDTH]: {
    padding: '0.75rem',
    fontSize: '2rem',
  },
}));

export default Button;
