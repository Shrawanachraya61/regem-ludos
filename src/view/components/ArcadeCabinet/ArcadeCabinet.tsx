/* @jsx h */
import { h } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { colors, style, MEDIA_QUERY_PHONE_WIDTH } from 'view/style';
import {
  hideControls,
  showControls,
  muteAudio,
  unmuteAudio,
  setScaleOriginal,
  setScaleWindow,
  setButtonDown,
  setButtonUp,
  beginCurrentArcadeGame,
} from 'controller/arcade-iframe-actions';

import Button, {
  ButtonType,
  ButtonContentWithIcon,
} from 'view/elements/Button';
import IframeShim from 'view/elements/IframeShim';
import { hideArcadeGame } from 'controller/ui-actions';
import {
  getArcadeGameVolume,
  getCurrentPlayer,
  getResPath,
  isArcadeGameMuted,
  setArcadeGameMuted,
} from 'model/generics';
import { getUiInterface } from 'view/ui';
import { playerModifyTokens } from 'model/player';
import { playSoundName } from 'model/sound';
import {
  ArcadeGamePath,
  ArcadeGamePathMeta,
  IArcadeCabinetConfig,
  IArcadeGameMeta,
} from './ArcadeCabinetHelpers';
import { unpause } from 'controller/loop';
import { useKeyboardEventListener } from 'view/hooks';
import {
  getEscapeKeyLabel,
  getMuteKeyLabel,
  getPauseKeyLabel,
  getSkipKeyLabel,
  isCancelKey,
  isConfirmKey,
  isEscapeKey,
  isMuteKey,
  isSelectKey,
} from 'controller/events';
import { isDevelopmentMode } from 'utils';
import {
  getCurrentSettings,
  saveSettingsToLS,
} from 'controller/save-management';
import Speaker from 'view/icons/Speaker';
import SpeakerOff from 'view/icons/SpeakerOff';
import Expand from 'view/icons/Expand';
import Contract from 'view/icons/Contract';

import './GameTicTacToe';
import './GamePresident';
import './GameInvaderz';
import './GameElasticity';
import './GameZag';
import './GameVortex';
import './GameBowling';

export enum SDLKeyID {
  Enter = 13,
  Space = 32,
  Left = 1073741904,
  Right = 1073741903,
  Up = 1073741906,
  Down = 1073741905,
  Shift = 1073742049,
}

export const buttonHandlers = (key: SDLKeyID) => {
  return {
    onMouseDown: () => {
      const isGameRunning = getUiInterface().appState.arcadeGame.isGameRunning;
      if (isGameRunning) {
        setButtonDown(key);
      }
    },
    onMouseUp: () => {
      const isGameRunning = getUiInterface().appState.arcadeGame.isGameRunning;
      if (isGameRunning) {
        setButtonUp(key);
      }
    },
    onTouchStart: () => {
      const isGameRunning = getUiInterface().appState.arcadeGame.isGameRunning;
      if (isGameRunning) {
        setButtonDown(key);
      }
    },
    onTouchEnd: () => {
      const isGameRunning = getUiInterface().appState.arcadeGame.isGameRunning;
      if (isGameRunning) {
        setButtonUp(key);
      }
    },
  };
};

interface IArcadeCabinetProps {
  game: ArcadeGamePath | '';
}

const CabinetWrapper = style(
  'div',
  (props: { background: string; fixed: boolean }) => {
    return {
      background: props.background,
      position: props.fixed ? 'fixed' : 'absolute',
      left: '0px',
      top: '0px',
      width: '100%',
      height: '100%',
    };
  }
);

const CabinetHeader = style('div', (props: { fixed: boolean }) => {
  return {
    position: props.fixed ? 'fixed' : 'absolute',
    left: '0px',
    top: '0px',
    padding: '1rem',
    width: '100%',
    background: colors.BLACK,
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
    [MEDIA_QUERY_PHONE_WIDTH]: {
      padding: '2rem',
    },
  };
});

const CabinetHeaderContainer = style('div', () => {
  return {
    display: 'flex',
    justifyContent: 'space-between',
  };
});

const CabinetHeaderButtonsContainer = style('div', () => {
  return {
    display: 'flex',
  };
});

const CabinetHeaderTicketsTokens = style('div', () => {
  return {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };
});

const CabinetHeaderTicketsTokensItem = style('div', () => {
  return {
    padding: '0px 8px',
  };
});

const CabinetInnerWrapper = style('div', () => {
  return {
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    height: '100%',
    pointerEvents: 'none',
  };
});

const CabinetTitle = style('div', (props: {}) => {
  return {
    border: `20px solid ${colors.BLACK}`,
    background: colors.DARKBLUE,
    color: colors.WHITE,
    fontSize: '4rem',
    width: '646px',
    boxSizing: 'border-box',
    textAlign: 'center',
  };
});

const CabinetImage = style('div', () => {
  return {
    backgroundImage: `url(${getResPath()}/img/arcade-cabinet.png)`,
    width: '646px',
    height: '712px',
    position: 'absolute',
    left: '0px',
    top: '0px',
    zIndex: '-1',
  };
});

const CabinetControls = style('div', (props: {}) => {
  return {
    height: '96px',
    width: '548px',
    background: colors.GREY,
    textAlign: 'center',
    zIndex: '1',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'all',
    transform: 'perspective(512px) rotateX(15deg) translateY(22px)',
    border: `2px solid ${colors.WHITE}`,
  };
});

const CabinetControlButton = style(
  'div',
  (props: {
    backgroundColor?: string;
    color?: string;
    width?: string;
    height?: string;
    type?: 'text' | 'other';
  }) => {
    return {
      tapHighlightColor: 'rgba(0, 0, 0, 0)',
      webkitTapHighlightColor: 'rgba(0, 0, 0, 0)',
      padding: '16px',
      fontSize: '16px',
      minWidth: props.width ? 'unset' : '48px',
      width: props.width,
      height: props.height,
      margin: '16px 4px',
      background: props.backgroundColor ?? colors.DARKBLUE,
      color: props.color ?? colors.WHITE,
      cursor: 'pointer',
      borderRadius: '8px',
      border: `2px solid ${colors.GREY}`,
      textAlign: 'center',
      fontFamily: 'monospace',
      userSelect: 'none',
      display: props.type === 'text' ? 'flex' : '',
      justifyContent: 'center',
      touchAction: 'manipulate',
      alignItems: 'center',
      '&:hover': {
        filter: 'brightness(120%)',
      },
      '&:active': {
        filter: 'brightness(80%)',
      },
    };
  }
);

const transformIframeUrlForDevelopment = (url: string) => {
  const ind = url.lastIndexOf('/');
  return `${url.slice(0, ind) + url.slice(ind)}`;
};

const InsertTokens = (props: { meta: IArcadeGameMeta; expanded: boolean }) => {
  const tokens = getCurrentPlayer().tokens;
  const tickets = getCurrentPlayer().tickets;
  const tokensRequired = props.meta.tokensRequired;
  const [tokensInserted, setTokensInserted] = useState(0);
  const isGameRunning = getUiInterface().appState.arcadeGame.isGameRunning;
  const isGameReady = getUiInterface().appState.arcadeGame.isGameReady;
  const isGameReadyToPlay = tokensInserted === tokensRequired;
  const expanded = props.expanded;

  const [isButtonActive, setButtonActive] = useState(false);
  const [cursorPos, setCursorPos] = useState(0);

  const handleTokenClick = () => {
    setButtonActive(true);
    setTimeout(() => {
      setButtonActive(false);
      if (isGameReadyToPlay) {
        playerModifyTokens(getCurrentPlayer(), -tokensInserted);
        setTokensInserted(0);
        beginCurrentArcadeGame();
        if (expanded) {
          showControls();
        }
      } else {
        setTokensInserted(tokensInserted + 1);
        playSoundName('insert_token');
        if (tokensInserted + 1 === tokensRequired) {
          setTimeout(() => {
            playSoundName('ready_arcade_game');
          }, 250);
        }
      }
    }, 100);
  };

  const handleEjectClick = () => {
    setButtonActive(true);
    setTimeout(() => {
      setButtonActive(false);
      setTokensInserted(0);
      playSoundName('eject_tokens');
    }, 100);
  };

  useKeyboardEventListener(ev => {
    if (isGameRunning) {
      return;
    }

    if (isCancelKey(ev.key)) {
      hideArcadeGame();
    }
    if (ev.key === 'ArrowLeft') {
      playSoundName('menu_move');
      setCursorPos(0);
    } else if (ev.key === 'ArrowRight') {
      playSoundName('menu_move');
      setCursorPos(1);
    } else if (isConfirmKey(ev.key)) {
      if (cursorPos === 0) {
        handleTokenClick();
      } else if (cursorPos === 1) {
        handleEjectClick();
      }
    }
  });

  return (
    <div>
      <CabinetHeaderTicketsTokens>
        <CabinetHeaderTicketsTokensItem>
          TOKENS: {tokens - tokensInserted}
        </CabinetHeaderTicketsTokensItem>
        <CabinetHeaderTicketsTokensItem>
          TICKETS: {tickets}
        </CabinetHeaderTicketsTokensItem>
        <CabinetHeaderTicketsTokensItem>
          <Button
            active={isButtonActive && cursorPos === 0}
            disabled={!isGameReady || isGameRunning || tokens <= 0}
            style={{
              width: '140px',
            }}
            showCursor={cursorPos === 0}
            type={isGameReadyToPlay ? ButtonType.PRIMARY : ButtonType.TOKEN}
            onClick={handleTokenClick}
          >
            {isGameReadyToPlay ? 'PLAY' : 'Insert Token'}
          </Button>
        </CabinetHeaderTicketsTokensItem>
        <CabinetHeaderTicketsTokensItem>
          <Button
            active={isButtonActive && cursorPos === 1}
            disabled={tokensInserted === 0}
            type={ButtonType.CANCEL}
            showCursor={cursorPos === 1}
            onClick={handleEjectClick}
          >
            Eject
          </Button>
        </CabinetHeaderTicketsTokensItem>
        <CabinetHeaderTicketsTokensItem>
          TOKENS INSERTED: {tokensInserted}/{tokensRequired}
        </CabinetHeaderTicketsTokensItem>
      </CabinetHeaderTicketsTokens>
    </div>
  );
};

interface ICabinetInnerProps {
  expanded: boolean;
  meta: IArcadeGameMeta;
  iframeRef: any;
  isGameReady: boolean;
  isGameRunning: boolean;
  setHelpDialogOpen: (v: boolean) => void;
  helpDialogOpen: boolean;
  muted: boolean;
  game: ArcadeGamePath | '';
}
const CabinetInner = (props: ICabinetInnerProps) => {
  const expanded = props.expanded;
  const meta = props.meta;
  const iframeRef = props.iframeRef;
  const isGameReady = props.isGameReady;
  const isGameRunning = props.isGameRunning;
  const setHelpDialogOpen = props.setHelpDialogOpen;
  const helpDialogOpen = props.helpDialogOpen;
  const muted = props.muted;
  return (
    <CabinetInnerWrapper>
      {expanded ? null : <CabinetTitle>{meta.title}</CabinetTitle>}
      <div
        style={{
          transition: 'height 0.25s',
          height: expanded ? '0px' : '32px',
          width: '646px',
          position: 'relative',
        }}
      >
        {expanded ? null : <CabinetImage />}
      </div>

      {props.game ? (
        <IframeShim
          id="arcade-iframe"
          ref={iframeRef}
          src={
            (isDevelopmentMode()
              ? transformIframeUrlForDevelopment(props.game)
              : props.game) + `?cabinet=true&mute=${muted}`
          }
          width={expanded ? '100%' : 512 + 'px'}
          height={expanded ? '100%' : 512 + 'px'}
          expanded={expanded}
          loading={!isGameReady}
          borderImageUrl={
            meta?.cabinet?.cabinetBorderImagePath ??
            `${getResPath()}/img/arcade-border-1.png`
          }
        ></IframeShim>
      ) : (
        <div>No game was specified.</div>
      )}
      {expanded && !isGameRunning ? (
        <div
          style={{
            pointerEvents: 'all',
            margin: '8px',
          }}
        >
          <InsertTokens meta={meta} expanded={expanded} />
        </div>
      ) : null}
      {expanded ? null : (
        <CabinetControls id="controls-arcade">
          {isGameRunning ? (
            meta.controls ? (
              <meta.controls setHelpDialogOpen={setHelpDialogOpen} />
            ) : (
              <div></div>
            )
          ) : (
            <InsertTokens meta={meta} expanded={expanded} />
          )}
        </CabinetControls>
      )}
      {meta?.help && helpDialogOpen ? (
        <meta.help setHelpDialogOpen={setHelpDialogOpen} />
      ) : null}
    </CabinetInnerWrapper>
  );
};

const CabinetSkeleton = (props: ICabinetInnerProps) => {
  // const expanded = props.expanded;
  const meta = props.meta;
  const iframeRef = props.iframeRef;
  const isGameReady = props.isGameReady;
  const isGameRunning = props.isGameRunning;
  // const setHelpDialogOpen = props.setHelpDialogOpen;
  // const helpDialogOpen = props.helpDialogOpen;
  const muted = props.muted;

  return (
    <CabinetInnerWrapper>
      {props.game ? (
        <IframeShim
          id="arcade-iframe"
          ref={iframeRef}
          src={
            (isDevelopmentMode()
              ? transformIframeUrlForDevelopment(props.game)
              : props.game) + `?cabinet=true&mute=${muted}`
          }
          width={'100%'}
          height={'100%'}
          expanded={true}
          loading={!isGameReady}
          borderImageUrl={undefined}
          // loading={true}
        ></IframeShim>
      ) : (
        <div>No game was specified.</div>
      )}
    </CabinetInnerWrapper>
  );
};

const ArcadeCabinet = (props: IArcadeCabinetProps) => {
  const [expanded, setExpanded] = useState(false);
  const [muted, setMuted] = useState(isArcadeGameMuted());
  const [volume, setVolume] = useState(getArcadeGameVolume());
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [tokensInserted] = useState(0);
  const meta: IArcadeGameMeta =
    ArcadeGamePathMeta[props.game] ?? ArcadeGamePathMeta.default;
  const tokensRequired = meta.tokensRequired;
  const isGameRunning = getUiInterface().appState.arcadeGame.isGameRunning;
  const isGameReady = getUiInterface().appState.arcadeGame.isGameReady;
  const isGameReadyToPlay = tokensInserted === tokensRequired;
  const iframeRef: any = useRef();

  useEffect(() => {
    if (!isGameRunning) {
      hideControls();
    }
  });

  const cancelGame = async () => {
    if (meta.onGameCancelled) {
      await meta.onGameCancelled();
    } else {
      hideArcadeGame();
      unpause();
    }
  };

  const handleExpand = () => {
    const nextExpanded = !expanded;
    setExpanded(nextExpanded);
    if (nextExpanded) {
      if (isGameReadyToPlay || isGameRunning) {
        showControls();
      } else {
        hideControls();
      }
      setScaleWindow();
    } else {
      hideControls();
      setScaleOriginal();
    }
  };

  const handleMuted = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);

    if (nextMuted) {
      muteAudio();
    } else {
      unmuteAudio();
    }

    // saves the arcade game mute/volume
    setArcadeGameMuted(nextMuted);
    saveSettingsToLS(getCurrentSettings());
  };

  useKeyboardEventListener(ev => {
    if (isEscapeKey(ev.key)) {
      cancelGame();
    } else if (isSelectKey(ev.key)) {
      handleExpand();
    } else if (isMuteKey(ev.key)) {
      handleMuted();
    }
  });

  let backgroundColor = colors.BGGREY;
  if (meta?.cabinet?.backgroundColor) {
    backgroundColor = meta?.cabinet?.backgroundColor;
  } else if (meta?.cabinet?.disabled) {
    backgroundColor = 'unset';
  }

  return (
    <CabinetWrapper
      background={backgroundColor}
      fixed={!meta?.cabinet?.disabled}
    >
      <CabinetHeader fixed={!meta?.cabinet?.disabled}>
        <CabinetHeaderContainer>
          <CabinetHeaderButtonsContainer>
            <Button
              type={ButtonType.CANCEL}
              onClick={() => {
                cancelGame();
              }}
              style={{
                marginRight: '1rem',
              }}
            >
              Back {getEscapeKeyLabel()}
            </Button>
            {meta.cabinet?.disabled ? null : (
              <Button
                type={ButtonType.PRIMARY}
                style={{
                  marginRight: '1rem',
                }}
                onClick={handleExpand}
              >
                {expanded ? (
                  <ButtonContentWithIcon>
                    <Contract color={colors.WHITE} />
                    Contract {getSkipKeyLabel()}
                  </ButtonContentWithIcon>
                ) : (
                  <ButtonContentWithIcon>
                    <Expand color={colors.WHITE} />
                    Expand {getSkipKeyLabel()}
                  </ButtonContentWithIcon>
                )}
              </Button>
            )}
            <Button
              type={ButtonType.PRIMARY}
              style={{
                marginRight: '1rem',
              }}
              onClick={handleMuted}
            >
              {muted ? (
                <ButtonContentWithIcon>
                  <SpeakerOff color={colors.WHITE} />
                  Unmute {getMuteKeyLabel()}
                </ButtonContentWithIcon>
              ) : (
                <ButtonContentWithIcon>
                  <Speaker color={colors.WHITE} />
                  Mute {getMuteKeyLabel()}
                </ButtonContentWithIcon>
              )}
            </Button>
          </CabinetHeaderButtonsContainer>
        </CabinetHeaderContainer>
      </CabinetHeader>
      {meta?.cabinet?.disabled ? (
        <CabinetSkeleton
          expanded={expanded}
          meta={meta}
          iframeRef={iframeRef}
          isGameReady={isGameReady}
          isGameRunning={isGameRunning}
          setHelpDialogOpen={setHelpDialogOpen}
          helpDialogOpen={helpDialogOpen}
          muted={muted}
          game={props.game}
        />
      ) : (
        <CabinetInner
          expanded={expanded}
          meta={meta}
          iframeRef={iframeRef}
          isGameReady={isGameReady}
          isGameRunning={isGameRunning}
          setHelpDialogOpen={setHelpDialogOpen}
          helpDialogOpen={helpDialogOpen}
          muted={muted}
          game={props.game}
        />
      )}
    </CabinetWrapper>
  );
};

export default ArcadeCabinet;
