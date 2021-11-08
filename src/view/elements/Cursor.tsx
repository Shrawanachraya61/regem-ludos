import { h } from 'preact';
import { style, colors, keyframes } from 'view/style';
import CursorIcon from 'view/icons/Cursor';

const cursorPulse = keyframes({
  '0%': {
    transform: 'translateX(-5px)',
  },
  '20%': {
    transform: 'translateX(0px)',
  },
  '100%': {
    transform: 'translateX(-5px)',
  },
});
const CursorRoot = style(
  'div',
  (props: { offsetX: number; offsetY: number }) => {
    return {
      pointerEvents: 'none',
      color: colors.WHITE,
      position: 'absolute',
      top: -4 + props.offsetY + 'px',
      left: -32 + props.offsetX + 'px',
      animation: `${cursorPulse} 500ms linear infinite`,
    };
  }
);
const Cursor = (props: {
  offsetX?: number;
  offsetY?: number;
  angle?: number;
  visibility?: 'hidden' | 'unset';
}): h.JSX.Element => {
  return (
    <CursorRoot
      offsetX={props.offsetX ?? 0}
      offsetY={props.offsetY ?? 0}
      style={{
        visibility: props.visibility ?? 'unset',
      }}
    >
      <CursorIcon color={colors.BLUE} angle={props.angle ?? 75} />
    </CursorRoot>
  );
};

export default Cursor;
