import { h, JSX } from 'preact';
import picostyle, { Styles, keyframes as k } from 'picostyle';
const ps = picostyle(h as any);

export const colors = {
  BLACK: '#111',
  WHITE: '#F8F8F8',
  LIGHTGREY: '#BCB7C5',
  GREY: '#999',
  DARKGREY: '#2E3740',
  DARKGREY_ALT: '#5A5353',
  BGGREY: '#333',
  RED: '#BE2633',
  DARKRED: '#5E3643',
  PINK: '#FFAEB6',
  LIGHTGREEN: '#B6D53C',
  GREEN: '#44891A',
  DARKGREEN: '#005F1B',
  BROWN: '#A46422',
  ORANGE: '#FAB40B',
  PURPLE: '#9964F9',
  LIGHTBLUE: '#42CAFD',
  BLUE: '#31A2F2',
  DARKBLUE: '#243F72',
  YELLOW: '#F4B41B',
};

export const MEDIA_QUERY_PHONE_WIDTH = '@media (max-width: 850px)';

type IntrinsicElement =
  | JSX.Element
  | JSX.Element[]
  | string
  | number
  | null
  | undefined;

export interface IntrinsicProps {
  id?: string;
  children?: never[] | IntrinsicElement[] | IntrinsicElement;
  style?: string | h.JSX.CSSProperties;
  onClick?: (ev: any) => void;
  onKeyDown?: (ev: any) => void;
  onMouseDown?: (ev: any) => void;
  onMouseOver?: (ev: any) => void;
  onMouseOut?: (ev: any) => void;
  onMouseUp?: (ev: any) => void;
  onTouchStart?: (ev: any) => void;
  onTouchEnd?: (ev: any) => void;
  ref?: Object;
}

export const style = function <T>(
  cmptType: string,
  style: Styles | ((props: T) => Styles)
) {
  const cmpt = ps(cmptType)(style);
  return (cmpt as unknown) as (props: IntrinsicProps & T) => JSX.Element;
};

export const keyframes = (props: any) => {
  return k(props);
};
