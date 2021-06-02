/* @jsx h */
import { h } from 'preact';
import { colors, IntrinsicProps, style } from 'view/style';

export enum CardSize {
  SMALL,
  MEDIUM,
  LARGE,
  XLARGE,
}

export const sizes = {
  [CardSize.SMALL]: {
    width: '256px',
    height: '256px',
  },
  [CardSize.MEDIUM]: {
    width: '352px',
    height: '352px',
  },
  [CardSize.LARGE]: {
    width: '512px',
    height: '512px',
  },
  [CardSize.XLARGE]: {
    width: '864px',
    // height: '864px',
  },
};

const Root = style('div', (props: { size: number }) => {
  return {
    background: colors.DARKGREY,
    border: '2px solid ' + colors.WHITE,
    borderBottom: '2px solid ' + colors.GREY,
    ...sizes[props.size],
  };
});

interface ICardProps extends IntrinsicProps {
  size: CardSize;
}

const Card = (props: ICardProps) => {
  return (
    <Root size={props.size} style={props.style}>
      {props.children}
    </Root>
  );
};

export default Card;
