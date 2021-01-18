export enum AppSection {
  BattleUI = 'battleMenu',
  BattleVictory = 'battleVictory',
  BattleDefeated = 'battleDefeated',
  Cutscene = 'cutscene',
  Debug = 'debug',
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
  text: string;
  speaker: CutsceneSpeaker;
  visible: boolean;
  portraitLeft: string;
  portraitLeft2: string;
  portraitRight: string;
  portraitRight2: string;
  portraitCenter: string;
}

export interface AppState {
  sections: AppSection[];
  cutscene: ICutsceneAppState;
  battle: {
    chButtonsEnabled: boolean;
  };
}

export const AppStateInitial: AppState = {
  sections: [AppSection.Debug] as AppSection[],
  cutscene: {
    text: '',
    speaker: CutsceneSpeaker.None,
    visible: true,
    portraitLeft: '',
    portraitLeft2: '',
    portraitRight: '',
    portraitRight2: '',
    portraitCenter: '',
  },
  battle: {
    chButtonsEnabled: true,
  },
};
