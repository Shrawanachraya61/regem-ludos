/* @jsx h */
import { h } from 'preact';
import { colors, keyframes, style } from 'view/style';
import { useState, useEffect, useRef } from 'preact/hooks';
import AnimDiv from 'view/elements/StaticAnimDiv';
import { getUiInterface } from 'view/ui';
import { AppSection, CutsceneSpeaker, ICutsceneAppState } from 'model/store';
import { getDrawScale } from 'model/canvas';
import { getCurrentKeyHandler, isAuxKey, isCancelKey } from 'controller/events';
import TalkIcon from 'view/icons/Talk';
import TopBar, { TopBarButtons } from '../TopBar';
import { hideSection, showSection, showSettings } from 'controller/ui-actions';
import { useKeyboardEventListener } from 'view/hooks';
import { getCurrentRoom, getCurrentScene } from 'model/generics';
import CharacterFollower from 'view/elements/CharacterFollower';

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

const BarBackground = style('div', () => {
  return {
    position: 'absolute',
    left: '0',
    top: '0',
    width: '100%',
    height: '100%',
    opacity: '0.04',
    backgroundImage: 'url(/res/bg/flowers_menu_bg.png)',
    zIndex: 0,
  };
});

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
    bottom: 'calc(50% - 22px)',
    right: props.flipped ? 'unset' : '-61px',
    left: props.flipped ? '-61px' : 'unset',
    width: '39px',
  };
});

interface IPhrase {
  innerHTML: string;
  delay: number;
  color: string;
  italic: boolean;
  shake: boolean;
  animation: string;
  scale: number;
  commands: IPhraseCommand[];
}
interface IPhraseCommand {
  name: string;
  arg: string;
}

enum PhraseCommandName {
  DELAY = 'delay',
  COLOR = 'color',
  SHAKE = 'shake',
  SCALE = 'scale',
  CASCADE = 'cascade',
  ITALIC = 'italic',
  CASCADE_LETTERS = 'cascade-letters',
}

const defaultPhrase = (text: string): IPhrase => {
  return {
    innerHTML: text,
    delay: 0,
    color: '',
    scale: 1.0,
    italic: false,
    shake: false,
    animation: '',
    commands: [],
  };
};

const parseDialogTextToPhrases = ((window as any).parseDialogTextToPhrases = (
  text: string
): IPhrase[] => {
  let commands = text.match(/<.+?>/g);
  if (!commands) {
    commands = ['<cascade=20>'];
    text = '<cascade=20>' + text;
    // return [defaultPhrase(text)];
  } else if (text[0] !== '<') {
    commands = ['<cascade=20>', ...commands];
    text = '<cascade=20>' + text;
  }

  const phrases: IPhrase[] = [];
  let lastCommands: IPhraseCommand[] = [];
  for (let i = 0; i < commands.length; i++) {
    const ind = text.indexOf(commands[i]);
    const subText = text.slice(0, ind);
    const commandText = commands[i].slice(1, -1);
    const phrase = defaultPhrase(subText);

    phrase.commands = lastCommands;
    lastCommands = commandText.split(' ').map(cmd => {
      return {
        name: (cmd.split('=')[0] ?? '').toLowerCase(),
        arg: cmd.split('=')[1] ?? '',
      };
    });
    text = text.slice(ind + commands[i].length);
    // accounts for case where a command is in the beginning
    if (!subText) {
      continue;
    }
    phrases.push(phrase);
  }
  const phrase = defaultPhrase(text);
  phrase.commands = lastCommands;
  phrases.push(phrase);

  let delayAgg = 0;
  for (let i = 0; i < phrases.length; i++) {
    const phrase = phrases[i];
    phrase.commands.forEach(command => {
      switch (command.name) {
        case PhraseCommandName.DELAY: {
          delayAgg += parseInt(command.arg) || 0;
          break;
        }
        case PhraseCommandName.COLOR: {
          phrase.color = colors[command.arg] || '';
          break;
        }
        case PhraseCommandName.SHAKE: {
          phrase.shake = true;
          break;
        }
        case PhraseCommandName.SCALE: {
          phrase.scale = parseFloat(command.arg) || 1;
          break;
        }
        case PhraseCommandName.ITALIC: {
          phrase.italic = true;
          break;
        }
      }
    });
    phrase.delay = delayAgg;
    phrase.commands.forEach(command => {
      switch (command.name) {
        case PhraseCommandName.CASCADE: {
          const delayInc = parseInt(command.arg) || 20;
          const words = phrase.innerHTML.split(/\s+/);
          const newPhrases: IPhrase[] = [];
          for (let j = 0; j < words.length; j++) {
            const word = words[j] || ' ';
            const newPhrase: IPhrase = {
              ...phrase,
              delay: phrase.delay + j * delayInc,
              innerHTML: word + (j < words.length - 1 ? ' ' : ''),
            };
            newPhrases.push(newPhrase);
          }
          phrases.splice(i, 1, ...newPhrases);
          delayAgg += words.length * delayInc;
          i += newPhrases.length - 1;
          break;
        }
        case PhraseCommandName.CASCADE_LETTERS: {
          const delayInc = parseInt(command.arg) || 50;
          const words = phrase.innerHTML.split('');
          const newPhrases: IPhrase[] = [];
          for (let j = 0; j < words.length; j++) {
            const word = words[j] || '&nbsp';
            const newPhrase: IPhrase = {
              ...phrase,
              delay: phrase.delay + j * delayInc,
              innerHTML: word === ' ' ? '&nbsp' : word,
            };
            newPhrases.push(newPhrase);
          }
          phrases.splice(i, 1, ...newPhrases);
          delayAgg += words.length * delayInc;
          i += newPhrases.length - 1;
          break;
        }
      }
    });
  }

  return phrases;
});

let lastRenderedCutsceneId = '';

const renderTextboxHtml = async (
  textBox: HTMLElement,
  cutscene: ICutsceneAppState
) => {
  textBox.innerHTML = '';

  if (cutscene.text === '') {
    return;
  }

  const talkIcon = document.getElementById('talk-icon');
  if (talkIcon) {
    talkIcon.style.display = 'none';
  }
  getCurrentScene().inputDisabled = true;
  const promises: Promise<void>[] = [];

  const setTimeoutPromise = (cb: () => void, ms: number) => {
    let timeoutId = -1;
    const promise = new Promise<void>(resolve => {
      timeoutId = setTimeout(() => {
        cb();
        resolve();
      }, ms) as any;
    }).catch(() => {
      clearTimeout(timeoutId);
    });
    promises.push(promise);
    return promise;
  };

  const getColorStyle = (phrase: IPhrase) => {
    return `color: ${phrase.color || colors.WHITE};`;
  };

  const getItalicStyle = (phrase: IPhrase) => {
    return phrase.italic ? 'font-style: italic;' : '';
  };

  const getShakeStyle = (phrase: IPhrase) => {
    return `animation: ${
      phrase.shake ? 'shake 0.5s infinite' : 'unset'
    }; display: ${phrase.shake ? 'inline-block' : 'inline'};`;
  };

  const getTransformStyle = (phrase: IPhrase) => {
    // cant just transform text because it doesn't move the text around it (overlaps)
    // return `transform: ${phrase.scale ? `scale(${phrase.scale});` : 'unset'}`;
    return `font-size: ${
      phrase.scale ? Math.floor(24 * phrase.scale) + 'px' : 'inherit'
    };`;
  };

  const renderSpan = (phrase: IPhrase) => {
    let html = `<span style="line-height:40px; vertical-align:middle; ${getColorStyle(
      phrase
    )}${getShakeStyle(phrase)}${getItalicStyle(phrase)}">${
      phrase.innerHTML
    }</span>`;
    if (phrase.scale !== 1.0) {
      html = `<span style="display: inline-block;${getTransformStyle(
        phrase
      )}">${html}</span>`;
    }
    return html;
  };

  const preSizeTextbox = async () => {
    let resultInnerHTML = '';
    phrases.forEach(phrase => {
      resultInnerHTML += renderSpan(phrase);
    });
    textBox.style.transition = '';
    textBox.style.opacity = '0';
    textBox.style.height = 'unset';
    textBox.innerHTML = resultInnerHTML;
    // HACK: hope that the textbox updates its render in 100ms, otherwise you're SOL
    await setTimeoutPromise(() => {}, 250);
    const boundingRect = textBox.getBoundingClientRect();
    // textBox.style.height = '0px';
    // textBox.style.transition = 'opacity 0.15s linear, height 0.15s linear';
    textBox.style.height = Math.max(40, boundingRect.height) + 'px';
    textBox.innerHTML = '';
  };

  const phrases = parseDialogTextToPhrases(cutscene.text);

  if (cutscene.id === lastRenderedCutsceneId) {
    // const phrases = parseDialogTextToPhrases(cutscene.text);

    let innerHTML = '';
    phrases.forEach(phrase => {
      innerHTML += renderSpan(phrase);
    });
    textBox.innerHTML = innerHTML;
  } else {
    await preSizeTextbox();
    textBox.style.transition = '';
    textBox.style.opacity = '0';
    // textBox.innerHTML = isNoneSpeaker ? '' : cutscene.text;
    // const phrases = parseDialogTextToPhrases(cutscene.text);

    let innerHTML = '';
    phrases.forEach(phrase => {
      if (phrase.delay) {
        setTimeoutPromise(() => {
          innerHTML += renderSpan(phrase);
          textBox.innerHTML = innerHTML;
        }, phrase.delay);
      } else {
        innerHTML += renderSpan(phrase);
      }
    });
    textBox.innerHTML = innerHTML;
    lastRenderedCutsceneId = cutscene.id;
    setTimeoutPromise(() => {
      textBox.style.transition = 'opacity 0.15s linear, height 0.15s linear';
      textBox.style.opacity = '1';
    }, 25);
  }

  await Promise.all(promises);
  // const talkIcon = document.getElementById('talk-icon');
  if (talkIcon) {
    await setTimeoutPromise(() => {}, 150);
    talkIcon.style.display = 'block';
  }
  getCurrentScene().inputDisabled = false;
};

const CutsceneSection = () => {
  const [barsVisible, setBarsVisible] = useState(false);
  const textBoxRef = useRef<null | HTMLDivElement>(null);
  const cutscene = getUiInterface().appState.cutscene;

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
      renderTextboxHtml(textBox, cutscene);
    }
  });

  useKeyboardEventListener(ev => {
    if (
      isAuxKey(ev.key) &&
      !getUiInterface().appState.sections.includes(AppSection.Settings)
    ) {
      showSettings(() => {
        showSection(AppSection.Cutscene, true);
      });
    }
  });

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

  const actors = getCurrentRoom()?.characters ?? [];

  return (
    <Root
      id="cutscene-root"
      fixed={!!getUiInterface().appState.arcadeGame.path}
      onClick={handleMouseClick}
    >
      <TopBarWrapper
        visible={cutscene.visible && cutscene.showBars && barsVisible}
      >
        <BarBackground />
      </TopBarWrapper>
      <BottomBarWrapper
        visible={cutscene.visible && cutscene.showBars && barsVisible}
      >
        <BarBackground />
      </BottomBarWrapper>
      <div
        style={{
          position: 'absolute',
          left: '0',
          top: '0',
          zIndex: 2,
          width: '100%',
        }}
      >
        <TopBar
          buttons={[TopBarButtons.SETTINGS]}
          onSettingsClick={() => {}}
          onSettingsClose={() => {
            hideSection(AppSection.Settings);
            // showSection(AppSection.Cutscene, false);
          }}
        ></TopBar>
      </div>
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
          <div
            id="cutscene-textbox-content"
            style={{
              opacity: '0',
              transition: 'unset',
            }}
            ref={textBoxRef}
          >
            {/* Is it stupid that this must be commented out for the text to fade properly? */}
            {/* Yes, Other Ben, yes it is. */}
            {/* {cutscene.text} */}
          </div>
          <TalkIconContainer
            id="talk-icon"
            style="display: none"
            flipped={cutscene.speaker === CutsceneSpeaker.Right}
          >
            <TalkIcon color={colors.WHITE} />
          </TalkIconContainer>
        </TextBox>
      </TextBoxWrapper>
      {actors.map(ch => {
        return (
          <CharacterFollower
            ch={ch}
            renderKey={'cutscene-follower-' + ch.name}
            key={'cutscene-follower-' + ch.name}
          >
            {ch.name === cutscene.actorName ? (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  position: 'relative',
                  top: '-32px',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    background:
                      'radial-gradient(circle, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 85%)',
                    animation: `${talkIconBounce} 750ms linear infinite`,
                  }}
                >
                  <TalkIcon color={colors.WHITE} />
                </div>
              </div>
            ) : null}
          </CharacterFollower>
        );
      })}
    </Root>
  );
};

export default CutsceneSection;
