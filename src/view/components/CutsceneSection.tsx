import { h, Fragment } from 'preact';
import { colors, style } from 'view/style';
import Button, { ButtonType } from 'view/elements/Button';
import { pause, unpause } from 'controller/loop';
import { useState, useEffect, useRef } from 'preact/hooks';
import AnimDiv from 'view/elements/AnimDiv';
import { getUiInterface } from 'view/ui';
import { CutsceneSpeaker } from 'model/store';
import { getDrawScale } from 'model/canvas';

export enum PortraitActiveState {
  Active = 'active',
  Inactive = 'inactive',
  Passive = 'passive',
  Invisible = 'invisible',
}

const Root = style('div', {
  position: 'absolute',
  top: '0px',
  overflow: 'hidden',
  width: '100%',
  height: '100%',
});

const TopBarWrapper = style('div', (props: { visible: boolean }) => ({
  position: 'absolute',
  top: '0px',
  width: '100%',
  height: props.visible ? '12.5%' : '0%',
  transition: 'height 0.25s',
  background: colors.DARKGREY,
}));

const BottomBarWrapper = style('div', (props: { visible: boolean }) => ({
  position: 'absolute',
  bottom: '0px',
  width: '100%',
  height: props.visible ? '12.5%' : '0%',
  transition: 'height 0.25s',
  background: colors.DARKGREY,
}));

const Portrait = style(
  'div',
  (props: { align: 'left' | 'right'; activeState: PortraitActiveState }) => {
    let opacity = '1';
    let hOffset = '0%';
    let vOffset = '0%';
    if (props.activeState === PortraitActiveState.Active) {
      hOffset = '3.125%';
    } else if (props.activeState === PortraitActiveState.Inactive) {
      hOffset = '-3.125%';
      vOffset = '-3.125%';
      opacity = '0.5';
    } else if (props.activeState === PortraitActiveState.Passive) {
      vOffset = '-3.125%';
    } else if (props.activeState === PortraitActiveState.Invisible) {
      opacity = '0';
    }

    const left = props.align === 'left' ? hOffset : '';
    const right = props.align === 'right' ? hOffset : '';

    return {
      position: 'absolute',
      minWidth: '50%',
      minHeight: '50%',
      transition: 'left 0.25s, right 0.25s, bottom 0.25s',
      left,
      right,
      bottom: vOffset,
      opacity,
    };
  }
);

const TextBoxWrapper = style(
  'div',
  (props: { align: 'left' | 'right' | 'center'; visible: boolean }) => {
    const hOffset = '6.25%';
    let left =
      props.align === 'left' ? hOffset : `calc(100% - ${hOffset} - 50%)`;
    if (props.align === 'center') {
      left = '25%';
    }
    return {
      position: 'absolute',
      width: '50%',
      height: '33%',
      left,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      transition: 'left 0.1s, transform 0.25s ease-in, opacity 0.25s linear',
      bottom: '0px',
      transform: props.visible ? 'scale(1)' : 'scale(0)',
    };
  }
);

const TextBox = style('div', {
  border: '2px solid ' + colors.WHITE,
  background: colors.BLACK,
  boxShadow: '0px 0px 24px 16px rgba(0, 0, 0, 0.75)',
  boxSizing: 'border-box',
  width: '100%',
  padding: '5%',
  color: colors.WHITE,
  fontSize: 24 * getDrawScale() + 'px',
  textAlign: 'left',
  transition: 'height 0.25s, width 0.25s',
});

const PortraitWrapper = style('div', (props: { visible: boolean }) => {
  console.log('PORTRAIT PROPS', props);
  return {
    position: 'absolute',
    left: '0px',
    top: '0px',
    width: '100%',
    height: '100%',
    transform: props.visible ? 'translateY(0%)' : 'translateY(55%)',
    transition: 'transform 0.33s, width 0.33s',
  };
});

const CutsceneSection = () => {
  const [barsVisible, setBarsVisible] = useState(false);
  const textBoxRef = useRef<null | HTMLSpanElement>(null);
  useEffect(() => {
    setBarsVisible(true);
  }, []);
  useEffect(() => {
    const textBox = textBoxRef?.current;
    if (textBox) {
      console.log('Render as text transition?', textBox.style.opacity);
      textBox.style.transition = '';
      textBox.style.opacity = '0';
      textBox.innerHTML = cutscene.text;
      setTimeout(() => {
        textBox.style.transition = 'opacity 0.15s linear';
        textBox.style.opacity = '1';
      }, 1);
    }
  });
  const cutscene = getUiInterface().appState.cutscene;
  console.log(
    'RENDER CUTSCENE',
    cutscene.text,
    cutscene.speaker,
    cutscene.visible
  );
  return (
    <Root>
      <TopBarWrapper visible={cutscene.visible && barsVisible}></TopBarWrapper>
      <BottomBarWrapper
        visible={cutscene.visible && barsVisible}
      ></BottomBarWrapper>
      <PortraitWrapper visible={cutscene.visible && barsVisible}>
        {cutscene.portraitLeft !== '' ? (
          <Portrait
            align="left"
            activeState={
              cutscene.speaker === CutsceneSpeaker.Left
                ? PortraitActiveState.Active
                : PortraitActiveState.Inactive
            }
          >
            <AnimDiv animName={cutscene.portraitLeft + '_f'} />
          </Portrait>
        ) : null}
        {cutscene.portraitRight !== '' ? (
          <Portrait
            align="right"
            activeState={
              cutscene.speaker === CutsceneSpeaker.Right
                ? PortraitActiveState.Active
                : PortraitActiveState.Inactive
            }
          >
            <AnimDiv animName={cutscene.portraitRight} />
          </Portrait>
        ) : null}
      </PortraitWrapper>
      <TextBoxWrapper
        visible={barsVisible && cutscene.text.length > 0}
        align={cutscene.speaker === CutsceneSpeaker.Left ? 'right' : 'left'}
      >
        <TextBox>
          <span
            style={{
              opacity: '0',
              transition: 'unset',
            }}
            ref={textBoxRef}
          >
            {/* Is this stupid? Yes. */}
            {/* {cutscene.text} */}
          </span>
        </TextBox>
      </TextBoxWrapper>
    </Root>
  );
};

export default CutsceneSection;
