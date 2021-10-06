/* @jsx h */
import { createAndCallScript } from 'controller/scene-management';
import {
  hideArcadeGame,
  hideSection,
  setInterfaceStateDisabled,
  showSection,
} from 'controller/ui-actions';
import {
  disableKeyUpdate,
  enableKeyUpdate,
  getCurrentScene,
} from 'model/generics';
import { AppSection } from 'model/store';
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
  PRESIDENT = 'iframes/president/dist/president.html',
  TIC_TAC_TOE = 'iframes/tic-tac-toe/dist/tic-tac-toe.html',
  INVADERZ = 'iframes/invaderz/dist/index.html',
  ELASTICITY = 'iframes/elasticity/dist/elasticity.html',
  VORTEX = 'iframes/vortex/dist/index.html',
  BOWLING = 'iframes/regem-ludos-bowling/dist/index.html',
}

export interface IArcadeCabinetConfig {
  disabled?: boolean;
  cabinetImagePath?: string;
  cabinetBorderImagePath?: string;
  backgroundColor?: string;
  music?: boolean;
}

export interface IArcadeGameMeta {
  title: string;
  tokensRequired: number;
  cabinet?: IArcadeCabinetConfig;
  controls?: (props: IControlsProps) => h.JSX.Element;
  help?: (props: IHelpProps) => h.JSX.Element;
  onGameCompleted?: (result: any) => Promise<void>;
  onGameCancelled?: () => Promise<void>;
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

export const callScriptSrcFromArcadeEvent = async (src: string) => {
  const scene = getCurrentScene();
  hideSection(AppSection.Debug);
  hideArcadeGame();
  disableKeyUpdate();
  setInterfaceStateDisabled(true);
  await createAndCallScript(scene, src);
  enableKeyUpdate();
  setInterfaceStateDisabled(false);
  showSection(AppSection.Debug, true);
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
