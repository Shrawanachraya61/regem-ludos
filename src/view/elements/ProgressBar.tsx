/* @jsx h */
import { h } from 'preact';
import { useRenderLoop } from 'view/hooks';
import { style } from 'view/style';

interface IProgressBarProps {
  backgroundColor: string;
  color: string;
  pct?: number;
  height: number;
  label: string;
  transitionDuration?: number;
}

interface IProgressBarRenderProps extends IProgressBarProps {
  id?: string;
  renderKey: string;
  renderFunc: () => number;
}

const Outer = style(
  'div',
  (props: { backgroundColor: string; height: number }) => {
    return {
      background: props.backgroundColor,
      position: 'relative',
      height: props.height + 'px',
      width: '100%',
    };
  }
);

const Inner = style('div', (props: { backgroundColor: string }) => {
  return {
    background: props.backgroundColor,
    position: 'absolute',
    left: '0',
    top: '0',
    width: '100%',
    height: '100%',
    transformOrigin: 'top left',
  };
});

const Label = style('div', {
  textAlign: 'center',
  fontSize: '16px',
  position: 'absolute',
  left: '0',
  top: '0',
  width: '100%',
  color: 'white',
});

const ProgressBar = (props: IProgressBarProps): h.JSX.Element => {
  return (
    <Outer backgroundColor={props.backgroundColor} height={props.height}>
      <Inner
        backgroundColor={props.color}
        style={{
          transform: `scaleX(${props.pct ?? 0})`,
          transition: props.transitionDuration
            ? `transform ${props.transitionDuration}ms ease-out`
            : 'unset',
        }}
      ></Inner>
      <Label>{props.label}</Label>
    </Outer>
  );
};

export const ProgressBarWithRender = (
  props: IProgressBarRenderProps
): h.JSX.Element => {
  useRenderLoop(props.renderKey);
  return <ProgressBar {...props} pct={props.renderFunc()} />;
};

export default ProgressBar;
