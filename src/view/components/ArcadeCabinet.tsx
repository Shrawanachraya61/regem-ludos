import { h } from 'preact';
import { useState } from 'preact/hooks';
import { colors, style, MEDIA_QUERY_PHONE_WIDTH } from 'view/style';

import Button, { ButtonType } from 'view/elements/Button';
import IframeShim from 'view/elements/IframeShim';

export enum ArcadeGamePath {
  PRESIDENT = 'iframes/president/president.html',
  TIC_TAC_TOE = 'iframes/tic-tac-toe/tic-tac-toe.html',
  INVADERZ = 'iframes/invaderz/Invaderz.html',
}

const ArcadeGamePathTitles = {
  [ArcadeGamePath.PRESIDENT]: 'President',
  [ArcadeGamePath.TIC_TAC_TOE]: 'Tic Tac Toe',
};

interface IArcadeCabinetProps {
  game: ArcadeGamePath;
}

const CabinetWrapper = style('div', () => {
  return {
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
  };
});

const ArcadeCabinet = (props: IArcadeCabinetProps) => {
  const [expanded, setExpanded] = useState(false);
  const [muted, setMuted] = useState(false);
  return (
    <CabinetWrapper>
      <CabinetHeader>
        <Button
          type={ButtonType.CANCEL}
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
            setExpanded(!expanded);
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
            setMuted(!muted);
          }}
        >
          {muted ? 'Unmute' : 'Mute'}
        </Button>
      </CabinetHeader>
      <CabinetInnerWrapper>
        {expanded ? null : (
          <CabinetTitle>{ArcadeGamePathTitles[props.game]}</CabinetTitle>
        )}
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
        <IframeShim
          src={props.game}
          width={expanded ? '100%' : 512 + 'px'}
          height={expanded ? '100%' : 512 + 'px'}
          expanded={expanded}
        ></IframeShim>
      </CabinetInnerWrapper>
    </CabinetWrapper>
  );
};

export default ArcadeCabinet;
