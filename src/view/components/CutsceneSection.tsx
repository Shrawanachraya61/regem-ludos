/* @jsx h */
import { h } from 'preact';
import { colors, keyframes, style } from 'view/style';
import { useState, useEffect, useRef } from 'preact/hooks';
import AnimDiv from 'view/elements/AnimDiv';
import { getUiInterface } from 'view/ui';
import { CutsceneSpeaker } from 'model/store';
import { getDrawScale } from 'model/canvas';
import { getCurrentKeyHandler } from 'controller/events';
import TalkIcon from 'view/icons/Talk';

export enum PortraitActiveState {
  Active = 'active',
  Inactive = 'inactive',
  Passive = 'passive',
  Invisible = 'invisible',
}

type TextBoxAlign =
  | 'left'
  | 'right'
  | 'center'
  | 'center-low'
  | 'center-high'
  | 'none';

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

const Root = style('div', (props: { fixed: boolean }) => {
  return {
    position: props.fixed ? 'fixed' : 'absolute',
    top: '0px',
    left: '0px',
    overflow: 'hidden',
    width: '100%',
    height: '100%',
  };
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
    let transition = 'left 0.2s, right 0.2s, bottom 0.2s';
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
      transition = '';
    }

    const left = props.align === 'left' ? hOffset : '';
    const right = props.align === 'right' ? hOffset : '';

    return {
      position: 'absolute',
      minWidth: '50%',
      minHeight: '50%',
      transition,
      left,
      right,
      bottom: vOffset,
      opacity,
    };
  }
);

const TextBoxWrapper = style(
  'div',
  (props: { align: TextBoxAlign; visible: boolean }) => {
    const hOffset = '29%';
    let width = '40%';
    let left =
      props.align === 'left' ? hOffset : `calc(100% - ${hOffset} - ${width})`;
    let height = '25%';
    let transition = 'height 0.1s, left 0.1s, transform 0.1s ease-in';
    if (props.align === 'center') {
      left = '25%';
      width = '50%';
      height = '50%';
      transition = 'height 0.1s, left 0.25s, transform 0.1s ease-in';
    } else if (props.align === 'center-low') {
      height = '35%';
      left = '25%';
      width = '50%';
    } else if (!props.visible) {
      transition = '';
    } else if (props.align === 'center-high') {
      left = '25%';
      width = '50%';
      height = '80%';
      transition = 'height 0.1s, left 0.25s, transform 0.1s ease-in';
    }

    return {
      position: 'absolute',
      width,
      height,
      left,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column',
      transition,
      bottom: '0px',
      transform: props.visible ? 'scale(1)' : 'scale(0)',
    };
  }
);

const TextBox = style(
  'div',
  (props: { align: TextBoxAlign; isNarration: boolean }) => {
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
      background: props.isNarration ? colors.DARKBLUE : colors.BLACK,
      boxShadow: '0px 0px 24px 16px rgba(0, 0, 0, 0.75)',
      boxSizing: 'border-box',
      width: '100%',
      padding: '2.5%',
      color: colors.WHITE,
      fontSize: '24px',
      textAlign: 'left',
      transition: 'height 0.1s, width 0.1s',
      borderBottomLeftRadius,
      borderBottomRightRadius,
      borderLeft,
      borderRight,
      paddingLeft,
      paddingRight,
      borderRightColor,
      borderLeftColor,
      borderTopColor: colors.BLUE,
      position: 'relative',
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

const NameLabelWrapper = style(
  'div',
  (props: { visible: boolean; align: string }) => {
    return {
      width: props.visible ? '100%' : '0px',
      display: 'flex',
      marginBottom: '16px',
      opacity: props.visible ? '100%' : '0%',
      justifyContent: props.align === 'right' ? 'flex-end' : 'flex-start',
      //transition: 'opacity 0.1s linear, width 0.1s',
    };
  }
);

const NameLabel = style('div', (props: {}) => {
  return {
    color: colors.BLACK,
    padding: '8px',
    fontSize: '18px',
    fontWeight: 'bold',
    boxShadow: '0px 0px 24px 16px rgba(0, 0, 0, 0.75)',
    background: colors.WHITE,
    border: '2px solid black',
    borderTopRightRadius: '8px',
    borderTopLeftRadius: '8px',
    minWidth: '64px',
    textAlign: 'center',
    textTransform: 'uppercase',
  };
});

const talkIconBounce = keyframes({
  '0%': {
    transform: 'translateY(-2px)',
  },
  '30%': {
    transform: 'translateY(2px)',
  },
  '100%': {
    transform: 'translateY(-2px)',
  },
});

const TalkIconContainer = style('div', (props: { flipped: boolean }) => {
  return {
    position: 'absolute',
    animation: `${talkIconBounce} 750ms linear infinite`,
    bottom: 'calc(50% - 12px)',
    right: props.flipped ? 'unset' : '-42px',
    left: props.flipped ? '-42px' : 'unset',
    width: '24px',
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

  let textBoxAlign: TextBoxAlign = 'center';
  if ([CutsceneSpeaker.Left].includes(cutscene.speaker)) {
    textBoxAlign = 'right';
  } else if ([CutsceneSpeaker.Center].includes(cutscene.speaker)) {
    textBoxAlign = 'right';
  } else if ([CutsceneSpeaker.Right].includes(cutscene.speaker)) {
    textBoxAlign = 'left';
  } else if (cutscene.portraitCenter) {
    textBoxAlign = 'center-low';
  }

  // HACK, this is stupid, but I'm feeling lazy
  if (cutscene.showBars === false) {
    textBoxAlign = 'center-high';
  }

  const isNoneSpeaker = [CutsceneSpeaker.None].includes(cutscene.speaker);

  const handleMouseClick = () => {
    // when mouse is clicked, simulate a keypress so user can click to advance dialogue
    const handler = getCurrentKeyHandler();
    if (handler && barsVisible && cutscene.visible) {
      handler({
        key: 'x',
      } as any);
    }
  };

  return (
    <Root
      id="cutscene-root"
      fixed={!!getUiInterface().appState.arcadeGame.path}
      onClick={handleMouseClick}
    >
      <TopBarWrapper
        visible={cutscene.visible && cutscene.showBars && barsVisible}
      ></TopBarWrapper>
      <BottomBarWrapper
        visible={cutscene.visible && cutscene.showBars && barsVisible}
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
        <NameLabelWrapper
          visible={!!cutscene.speakerName}
          align={cutscene.speaker === CutsceneSpeaker.Right ? 'right' : 'left'}
        >
          <NameLabel>{cutscene.speakerName}</NameLabel>
        </NameLabelWrapper>
        <TextBox
          id="cutscene-textbox"
          align={textBoxAlign}
          isNarration={!cutscene.speakerName && !isNoneSpeaker}
        >
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
          <TalkIconContainer
            flipped={cutscene.speaker === CutsceneSpeaker.Right}
          >
            <TalkIcon color={colors.WHITE} />
          </TalkIconContainer>
        </TextBox>
      </TextBoxWrapper>
    </Root>
  );
};

export default CutsceneSection;
