import { ArcadeGamePath } from 'view/components/ArcadeCabinet';
import { BattleCharacter } from './battle-character';
import { Character } from './character';
import { Particle } from './particle';

export enum AppSection {
  BattleUI = 'battleMenu',
  BattleVictory = 'battleVictory',
  BattleDefeated = 'battleDefeated',
  Cutscene = 'cutscene',
  Debug = 'debug',
  ArcadeCabinet = 'arcadeCabinet',
  Choices = 'choices',
  Settings = 'settings',
  Modal = 'modal',
  Save = 'save',
  Menu = 'menu',
  LevelUp = 'level-up',
  Quest = 'quest',
}

export enum CutsceneSpeaker {
  Left = 'left',
  Left2 = 'left2',
  Right = 'right',
  Right2 = 'right2',
  Center = 'center',
  None = 'none',
}

export interface ICutsceneAppState {
  id: string;
  text: string;
  showBars: boolean;
  speaker: CutsceneSpeaker;
  speakerName: string;
  actorName: string;
  visible: boolean;
  portraitLeft: string;
  portraitLeftEmotion: string;
  portraitLeft2: string;
  portraitLeft2Emotion: string;
  portraitRight: string;
  portraitRightEmotion: string;
  portraitRight2: string;
  portraitRight2Emotion: string;
  portraitCenter: string;
  portraitCenterEmotion: string;
  actors: Character[];
  portraitActors: Character[];
}

export interface IArcadeCabinetState {
  path: ArcadeGamePath | '';
  isGameRunning: boolean;
  isGameReady: boolean;
}

export interface IChoicesState {
  choiceTexts: string[];
  keyHandlerInternal: () => void;
}

export interface IBattleUiState {
  disabled: boolean;
  paused: boolean;
  characterIndexSelected: number;
  targetIndexSelected: number;
  effect: {
    active: boolean;
    bChList: BattleCharacter[];
    effectAnimName: string;
  };
}

export interface IOverworldAppState {
  characterText: string;
  prevCharacterText: string;
  interfaceDisabled: boolean;
}

export enum ModalSection {
  TUTORIAL_ATTACK = 'TUTORIAL_ATTACK',
  TUTORIAL_PAUSING = 'TUTORIAL_PAUSING',
  TUTORIAL_ATTACK_AMOUNTS = 'TUTORIAL_ATTACK_AMOUNTS',
  TUTORIAL_STAGGER = 'TUTORIAL_STAGGER',
  TUTORIAL_BACK_ROW = 'TUTORIAL_BACK_ROW',
  TUTORIAL_MAGIC = 'TUTORIAL_MAGIC',
  TUTORIAL_ARMOR = 'TUTORIAL_ARMOR',
  ITEM = 'ITEM',
  INFO = 'INFO',
  CONFIRM = 'CONFIRM',
  SELECT_PARTY_MEMBER = 'SELECT_PARTY_MEMBER',
}

export interface IModalState {
  section: ModalSection;
  onClose: () => void;
  onConfirm?: (v?: any) => void | Promise<void>;
  body?: any;
  danger: boolean;
  filter: (a: any) => boolean;
  meta?: any;
}

export interface ISettingsState {
  onClose: () => void;
}

export interface ISaveState {
  onClose: () => void;
}

export interface IMenuState {
  onClose: () => void;
}

export interface ILevelUpState {
  onClose: () => void;
}

export interface IQuestState {
  onClose: () => void;
  questName: string;
}

export interface IRoomState {
  particles: Particle[];
}

export interface NotificationState {
  type: 'success' | 'info' | 'warning' | 'danger';
  text: string;
  timeoutId?: number;
}

export interface AppState {
  sections: AppSection[];
  room: IRoomState;
  overworld: IOverworldAppState;
  cutscene: ICutsceneAppState;
  battle: IBattleUiState;
  arcadeGame: IArcadeCabinetState;
  choices: IChoicesState;
  modal: IModalState;
  settings: ISettingsState;
  save: ISaveState;
  menu: IMenuState;
  levelUp: ILevelUpState;
  quest: IQuestState;
  notifications: NotificationState[];
}

export const AppStateInitial: AppState = {
  sections: [AppSection.Debug] as AppSection[],
  room: {
    particles: [],
  },
  overworld: {
    characterText: '',
    prevCharacterText: '',
    interfaceDisabled: false,
  },
  cutscene: {
    id: '',
    showBars: true,
    text: '',
    speaker: CutsceneSpeaker.None,
    speakerName: '',
    actorName: '',
    visible: true,
    portraitLeft: '',
    portraitLeftEmotion: '',
    portraitLeft2: '',
    portraitLeft2Emotion: '',
    portraitRight: '',
    portraitRightEmotion: '',
    portraitRight2: '',
    portraitRight2Emotion: '',
    portraitCenter: '',
    portraitCenterEmotion: '',
    actors: [],
    portraitActors: [],
  },
  battle: {
    characterIndexSelected: 0,
    targetIndexSelected: 0,
    disabled: false,
    paused: false,
    effect: {
      active: false,
      bChList: [],
      effectAnimName: '',
    },
  },
  arcadeGame: {
    path: '',
    isGameRunning: false,
    isGameReady: false,
  },
  choices: {
    choiceTexts: [],
    keyHandlerInternal: () => {},
  },
  modal: {
    section: ModalSection.TUTORIAL_ATTACK,
    onClose: () => {},
    danger: false,
    filter: () => true,
  },
  settings: {
    onClose: () => {},
  },
  save: {
    onClose: () => {},
  },
  menu: {
    onClose: () => {},
  },
  levelUp: {
    onClose: () => {},
  },
  quest: {
    onClose: () => {},
    questName: '',
  },
  notifications: [],
};
