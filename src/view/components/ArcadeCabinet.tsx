import { h, Fragment } from 'preact';
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
} from 'controller/arcade-iframe-actions';

import Button, { ButtonType } from 'view/elements/Button';
import IframeShim from 'view/elements/IframeShim';
import Arrow from 'view/icons/Arrow';
import Help from 'view/icons/Help';
import { hideArcadeGame } from 'controller/ui-actions';

export enum ArcadeGamePath {
  PRESIDENT = 'iframes/president/president.html',
  TIC_TAC_TOE = 'iframes/tic-tac-toe/tic-tac-toe.html',
  INVADERZ = 'iframes/invaderz/Invaderz.html',
  ELASTICITY = 'iframes/elasticity/elasticity.html',
}

const ArcadeGamePathMeta = {
  default: {
    title: 'No Game Specified',
    controls: () => {
      return <div></div>;
    },
  },
  [ArcadeGamePath.PRESIDENT]: {
    title: 'President',
    controls: () => {
      return <div></div>;
    },
  },
  [ArcadeGamePath.TIC_TAC_TOE]: {
    title: 'Tic Tac Toe',
    controls: () => {
      return (
        <>
          <CabinetControlButton
            width="48px"
            height="48px"
            type="text"
            {...buttonHandlers(SDLKeyID.Enter)}
          >
            <Help color={colors.YELLOW} />
          </CabinetControlButton>
        </>
      );
    },
  },
  [ArcadeGamePath.INVADERZ]: {
    title: 'INVADERZ',
    controls: () => (
      <>
        <CabinetControlButton
          width="48px"
          height="48px"
          {...buttonHandlers(SDLKeyID.Left)}
        >
          <Arrow color={colors.GREEN} direction="left"></Arrow>
        </CabinetControlButton>
        <CabinetControlButton
          width="48px"
          height="48px"
          {...buttonHandlers(SDLKeyID.Right)}
        >
          <Arrow color={colors.GREEN} direction="right"></Arrow>
        </CabinetControlButton>
        <CabinetControlButton
          width="48px"
          height="48px"
          type="text"
          {...buttonHandlers(SDLKeyID.Space)}
        >
          FIRE
        </CabinetControlButton>
        <CabinetControlButton
          width="48px"
          height="48px"
          type="text"
          {...buttonHandlers(SDLKeyID.Enter)}
        >
          START
        </CabinetControlButton>
      </>
    ),
  },
  [ArcadeGamePath.ELASTICITY]: {
    title: 'ELASTICITY',
    controls: () => (
      <>
        <CabinetControlButton
          width="48px"
          height="48px"
          {...buttonHandlers(SDLKeyID.Left)}
        >
          <Arrow color={colors.GREEN} direction="left"></Arrow>
        </CabinetControlButton>
        <CabinetControlButton
          width="48px"
          height="48px"
          {...buttonHandlers(SDLKeyID.Right)}
        >
          <Arrow color={colors.GREEN} direction="right"></Arrow>
        </CabinetControlButton>
        <CabinetControlButton
          width="48px"
          height="48px"
          type="text"
          {...buttonHandlers(SDLKeyID.Enter)}
        >
          START
        </CabinetControlButton>
      </>
    ),
  },
};

enum SDLKeyID {
  Enter = 13,
  Space = 32,
  Left = 1073741904,
  Right = 1073741903,
}

const buttonHandlers = (key: SDLKeyID) => {
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
  const meta = ArcadeGamePathMeta[props.game] ?? ArcadeGamePathMeta.default;
  return (
    <CabinetWrapper>
      <CabinetHeader>
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
          ></IframeShim>
        ) : (
          <div>No game was specified.</div>
        )}
        {expanded ? null : (
          <CabinetControls id="controls-arcade">
            {meta.controls()}
          </CabinetControls>
        )}
      </CabinetInnerWrapper>
    </CabinetWrapper>
  );
};

export default ArcadeCabinet;
