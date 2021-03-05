import { h } from 'preact';
import { colors, style } from 'view/style';

export const registerArcadeGameMeta = (
  gamePath: ArcadeGamePath,
  meta: IArcadeGameMeta
) => {
  ArcadeGamePathMeta[gamePath] = meta;
};

export interface IControlsProps {
  setHelpDialogOpen: (v: boolean) => void;
}

export interface IHelpProps {
  setHelpDialogOpen: (v: boolean) => void;
}

export enum ArcadeGamePath {
  PRESIDENT = 'iframes/president/president.html',
  TIC_TAC_TOE = 'iframes/tic-tac-toe/tic-tac-toe.html',
  INVADERZ = 'iframes/invaderz/Invaderz.html',
  ELASTICITY = 'iframes/elasticity/elasticity.html',
}

export interface IArcadeGameMeta {
  title: string;
  tokensRequired: number;
  controls: (props: IControlsProps) => h.JSX.Element;
  help?: (props: IHelpProps) => h.JSX.Element;
  onGameCompleted?: (result: any) => Promise<void>;
}

export const ArcadeGamePathMeta: Record<string, IArcadeGameMeta> = {
  default: {
    title: 'No Game Specified',
    tokensRequired: 99,
    controls: () => {
      return <div></div>;
    },
  },
};

export const getArcadeGamePathMeta = (path: ArcadeGamePath) => {
  return ArcadeGamePathMeta[path];
};

export const CabinetControlButton = style(
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
