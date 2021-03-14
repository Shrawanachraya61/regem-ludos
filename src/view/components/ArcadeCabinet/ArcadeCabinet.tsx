/* @jsx h */
import { h, Fragment, JSX } from 'preact';
import { useState } from 'preact/hooks';
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

import Button, { ButtonType } from 'view/elements/Button';
import IframeShim from 'view/elements/IframeShim';
import Arrow from 'view/icons/Arrow';
import Help from 'view/icons/Help';
import { hideArcadeGame } from 'controller/ui-actions';
import { getCurrentPlayer } from 'model/generics';
import { getUiInterface, uiInterface } from 'view/ui';
import { playerModifyTokens } from 'model/player';
import { playSoundName } from 'model/sound';
import {
  ArcadeGamePath,
  ArcadeGamePathMeta,
  IArcadeGameMeta,
} from './ArcadeCabinetHelpers';

import './GameTicTacToe';
import './GamePresident';
import './GameInvaderz';
import './GameElasticity';

export enum SDLKeyID {
  Enter = 13,
  Space = 32,
  Left = 1073741904,
  Right = 1073741903,
}

export const buttonHandlers = (key: SDLKeyID) => {
  return {
    onMouseDown: () => {
      setButtonDown(key);
    },
    onMouseUp: () => {
      setButtonUp(key);
    },
    onTouchStart: () => {
      setButtonDown(key);
    },
    onTouchEnd: () => {
      setButtonUp(key);
    },
  };
};

interface IArcadeCabinetProps {
  game: ArcadeGamePath | '';
}

const CabinetWrapper = style('div', () => {
  return {
    background: colors.BGGREY,
    position: 'fixed',
    left: '0px',
    top: '0px',
    width: '100%',
    height: '100%',
  };
});

const CabinetHeader = style('div', (props: {}) => {
  return {
    position: 'fixed',
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
    backgroundImage: 'url(res/img/arcade-cabinet.png)',
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
    minHeight: '96px',
    width: '548px',
    background: colors.GREY,
    textAlign: 'center',
    zIndex: '1',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'all',
    transform: 'perspective(512px) rotateX(24deg) translateY(12px)',
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

const ArcadeCabinet = (props: IArcadeCabinetProps) => {
  const [expanded, setExpanded] = useState(false);
  const [muted, setMuted] = useState(false);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [tokensInserted, setTokensInserted] = useState(0);
  const meta: IArcadeGameMeta =
    ArcadeGamePathMeta[props.game] ?? ArcadeGamePathMeta.default;
  const tokens = getCurrentPlayer().tokens;
  const tickets = getCurrentPlayer().tickets;
  const tokensRequired = meta.tokensRequired;
  const isGameRunning = getUiInterface().appState.arcadeGame.isGameRunning;
  const isGameReady = getUiInterface().appState.arcadeGame.isGameReady;

  return (
    <CabinetWrapper>
      <CabinetHeader>
        <CabinetHeaderContainer>
          <CabinetHeaderButtonsContainer>
            <Button
              type={ButtonType.CANCEL}
              onClick={() => {
                hideArcadeGame();
              }}
              style={{
                marginRight: '1rem',
              }}
            >
              Back
            </Button>
            <Button
              type={ButtonType.PRIMARY}
              style={{
                marginRight: '1rem',
              }}
              onClick={() => {
                const nextExpanded = !expanded;
                setExpanded(nextExpanded);
                if (nextExpanded) {
                  showControls();
                  setScaleWindow();
                } else {
                  hideControls();
                  setScaleOriginal();
                }
              }}
            >
              {expanded ? 'Contract' : 'Expand'}
            </Button>
            <Button
              type={ButtonType.PRIMARY}
              style={{
                marginRight: '1rem',
              }}
              onClick={() => {
                const nextMuted = !muted;
                setMuted(nextMuted);
                if (nextMuted) {
                  muteAudio();
                } else {
                  unmuteAudio();
                }
              }}
            >
              {muted ? 'Unmute' : 'Mute'}
            </Button>
          </CabinetHeaderButtonsContainer>
          <CabinetHeaderTicketsTokens>
            <CabinetHeaderTicketsTokensItem>
              TOKENS: {tokens - tokensInserted}
            </CabinetHeaderTicketsTokensItem>
            <CabinetHeaderTicketsTokensItem>
              TICKETS: {tickets}
            </CabinetHeaderTicketsTokensItem>
            <CabinetHeaderTicketsTokensItem>
              <Button
                disabled={!isGameReady || isGameRunning || tokens <= 0}
                style={{
                  width: '140px',
                }}
                type={
                  tokensInserted === tokensRequired
                    ? ButtonType.PRIMARY
                    : ButtonType.TOKEN
                }
                onClick={() => {
                  if (tokensInserted === tokensRequired) {
                    playerModifyTokens(getCurrentPlayer(), -tokensInserted);
                    setTokensInserted(0);
                    beginCurrentArcadeGame();
                  } else {
                    setTokensInserted(tokensInserted + 1);
                    playSoundName('insert_token');
                    if (tokensInserted + 1 === tokensRequired) {
                      setTimeout(() => {
                        playSoundName('ready_arcade_game');
                      }, 250);
                    }
                  }
                }}
              >
                {tokensInserted === tokensRequired ? 'PLAY' : 'Insert Token'}
              </Button>
            </CabinetHeaderTicketsTokensItem>
            <CabinetHeaderTicketsTokensItem>
              <Button
                disabled={tokensInserted === 0}
                type={ButtonType.CANCEL}
                onClick={() => {
                  setTokensInserted(0);
                  playSoundName('eject_tokens');
                }}
              >
                Eject Tokens
              </Button>
            </CabinetHeaderTicketsTokensItem>
            <CabinetHeaderTicketsTokensItem>
              TOKENS INSERTED: {tokensInserted}/{tokensRequired}
            </CabinetHeaderTicketsTokensItem>
          </CabinetHeaderTicketsTokens>
        </CabinetHeaderContainer>
      </CabinetHeader>
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
            src={props.game + '?cabinet=true&mute=true'}
            width={expanded ? '100%' : 512 + 'px'}
            height={expanded ? '100%' : 512 + 'px'}
            expanded={expanded}
            loading={!isGameReady}
          ></IframeShim>
        ) : (
          <div>No game was specified.</div>
        )}
        {expanded ? null : (
          <CabinetControls id="controls-arcade">
            <meta.controls setHelpDialogOpen={setHelpDialogOpen} />
          </CabinetControls>
        )}
        {meta?.help && helpDialogOpen ? (
          <meta.help setHelpDialogOpen={setHelpDialogOpen} />
        ) : null}
      </CabinetInnerWrapper>
    </CabinetWrapper>
  );
};

export default ArcadeCabinet;
