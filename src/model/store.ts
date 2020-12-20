export enum AppSection {
  BattleUI = 'battleMenu',
  BattleVictory = 'battleVictory',
  BattleDefeated = 'battleDefeated',
  Debug = 'debug'
}

export interface AppState {
  sections: AppSection[];
  battle: {
    chButtonsEnabled: boolean;
  };
}

export const AppStateInitial: AppState = {
  sections: [AppSection.Debug] as AppSection[],
  battle: {
    chButtonsEnabled: true,
  },
};