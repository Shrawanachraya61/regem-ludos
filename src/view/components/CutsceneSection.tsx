import { h } from 'preact';
import { colors, style } from 'view/style';
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

const determinePortraitAnim = (
  base: string,
  emotion: string,
  facingDirection: string
): string => {
  let animStr = '';
  if (emotion) {
    animStr = `${base}_portrait_${emotion}`;
  } else {
    animStr = `${base}_portrait`;
  }
  if (facingDirection === 'right') {
    animStr += '_f';
  }
  return animStr;
};

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
  height: props.visible ? '17%' : '0%',
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
      hOffset = '-50%';
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
  (props: {
    align: 'left' | 'right' | 'center' | 'center-low';
    visible: boolean;
  }) => {
    const hOffset = '6.25%';
    let left =
      props.align === 'left' ? hOffset : `calc(100% - ${hOffset} - 50%)`;
    let height = '20%';
    let transition = 'height 0.1s, left 0.1s, transform 0.25s ease-in';
    if (props.align === 'center') {
      left = '25%';
      height = '75%';
      transition = 'height 0.25s, left 0.25s, transform 0.25s ease-in';
    } else if (props.align === 'center-low') {
      left = '25%';
      height = '35%';
    }

    return {
      position: 'absolute',
      width: '50%',
      height,
      left,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      transition,
      bottom: '0px',
      transform: props.visible ? 'scale(1)' : 'scale(0)',
    };
  }
);

const TextBox = style(
  'div',
  (props: { align: 'right' | 'left' | 'center' | 'center-low' }) => {
    let borderBottomLeftRadius = 'unset';
    let borderBottomRightRadius = 'unset';
    let borderLeft = 'solid';
    let borderRight = 'solid';
    let paddingLeft = '2.5%';
    let paddingRight = '2.5%';
    let borderRightColor = colors.WHITE;
    let borderLeftColor = colors.WHITE;
    if (props.align === 'right') {
      paddingLeft = '5%';
      borderBottomLeftRadius = '48px';
      borderLeft = '16px solid';
      borderLeftColor = colors.BLUE;
    } else if (props.align === 'left') {
      paddingRight = '5%';
      borderBottomRightRadius = '48px';
      borderRight = '16px solid';
      borderRightColor = colors.BLUE;
    }

    return {
      border: '2px solid ' + colors.WHITE,
      background: colors.BLACK,
      boxShadow: '0px 0px 24px 16px rgba(0, 0, 0, 0.75)',
      boxSizing: 'border-box',
      width: '100%',
      padding: '2.5%',
      color: colors.WHITE,
      fontSize: '24px',
      textAlign: 'left',
      transition: 'height 0.25s, width 0.25s',
      borderBottomLeftRadius,
      borderBottomRightRadius,
      borderLeft,
      borderRight,
      paddingLeft,
      paddingRight,
      borderRightColor,
      borderLeftColor,
      borderTopColor: colors.BLUE,
    };
  }
);

const PortraitWrapper = style('div', (props: { visible: boolean }) => {
  return {
    position: 'absolute',
    left: '0px',
    top: '0px',
    width: '100%',
    height: '100%',
    transform: props.visible ? 'translateY(0%)' : 'translateY(55%)',
    transition: 'transform 0.15s',
  };
});

const CutsceneSection = () => {
  const [barsVisible, setBarsVisible] = useState(false);
  const textBoxRef = useRef<null | HTMLSpanElement>(null);

  // This hook executes on first render.  If a cutscene is not currently being rendered,
  // then this will pull the cutscene bars towards the center of the screen.
  useEffect(() => {
    setBarsVisible(true);
  }, []);

  // this hook executes on each render.  Preact renders the text as opacity '0',
  // then this sets the opacity to '1' with a transition so that it fades in.
  // The desired effect is that the text fades out, then in when the dialog box
  // changes text.
  useEffect(() => {
    const textBox = textBoxRef?.current;
    if (textBox) {
      textBox.style.transition = '';
      textBox.style.opacity = '0';
      textBox.innerHTML = cutscene.text;
      setTimeout(() => {
        textBox.style.transition = 'opacity 0.15s linear';
        textBox.style.opacity = '1';
      }, 25);
    }
  });
  const cutscene = getUiInterface().appState.cutscene;

  let textBoxAlign: 'left' | 'right' | 'center' | 'center-low' = 'center';
  if ([CutsceneSpeaker.Left].includes(cutscene.speaker)) {
    textBoxAlign = 'right';
  } else if ([CutsceneSpeaker.Center].includes(cutscene.speaker)) {
    textBoxAlign = 'right';
  } else if ([CutsceneSpeaker.Right].includes(cutscene.speaker)) {
    textBoxAlign = 'left';
  } else if (cutscene.portraitCenter) {
    textBoxAlign = 'center-low';
  }

  console.log('render textboxalgin', textBoxAlign);

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
            <AnimDiv
              animName={determinePortraitAnim(
                cutscene.portraitLeft,
                cutscene.portraitLeftEmotion,
                'right'
              )}
            />
          </Portrait>
        ) : null}
        {cutscene.portraitCenter !== '' ? (
          <Portrait
            align="left"
            activeState={
              cutscene.speaker === CutsceneSpeaker.Center
                ? PortraitActiveState.Active
                : PortraitActiveState.Invisible
            }
          >
            <AnimDiv
              animName={determinePortraitAnim(
                cutscene.portraitCenter,
                cutscene.portraitCenterEmotion,
                'right'
              )}
            />
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
            <AnimDiv
              animName={determinePortraitAnim(
                cutscene.portraitRight,
                cutscene.portraitRightEmotion,
                'left'
              )}
            />
          </Portrait>
        ) : null}
      </PortraitWrapper>
      <TextBoxWrapper
        visible={barsVisible && cutscene.text.length > 0}
        align={textBoxAlign}
      >
        <TextBox align={textBoxAlign}>
          <span
            style={{
              opacity: '0',
              transition: 'unset',
            }}
            ref={textBoxRef}
          >
            {/* Is it stupid that this must be commented out for the text to fade properly? */}
            {/* Yes, Other Ben, yes it is. */}
            {/* {cutscene.text} */}
          </span>
        </TextBox>
      </TextBoxWrapper>
    </Root>
  );
};

export default CutsceneSection;
