import { h } from 'preact';
import style from 'view/style';

interface IProgressBarProps {
  backgroundColor: string;
  color: string;
  pct: number;
  height: number;
  label: string;
}

const Outer = style('div', props => {
  return {
    background: props.backgroundColor,
    position: 'relative',
    height: props.height + 'px',
    width: '100%',
  };
});

const Inner = style('div', props => {
  return {
    background: props.backgroundColor,
    position: 'absolute',
    left: '0',
    top: '0',
    width: props.pct + '%',
    height: '100%',
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
      <Inner pct={props.pct * 100} backgroundColor={props.color}></Inner>
      <Label>{props.label}</Label>
    </Outer>
  );
};

export default ProgressBar;
