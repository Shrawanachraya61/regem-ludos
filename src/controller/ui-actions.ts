import { getUiInterface, renderUi } from 'view/ui';
import {
  AppState,
  AppSection,
  ICutsceneAppState,
  CutsceneSpeaker,
  IArcadeCabinetState,
  IChoicesState,
  IBattleUiState,
  IOverworldAppState,
  ModalSection,
  IModalState,
  ISettingsState,
  ISaveState,
} from 'model/store';
import { ArcadeGamePath } from 'view/components/ArcadeCabinet';
import { getCurrentOverworld } from 'model/generics';
import { overworldShow } from 'model/overworld';
import { playSound, playSoundName } from 'model/sound';
import { BattleCharacter } from 'model/battle-character';
import { popKeyHandler, pushEmptyKeyHandler } from './events';

export interface ReducerAction<T> {
  action: string;
  payload: T;
}

type MutationFunction = (
  newState: AppState,
  payload?: any,
  oldState?: AppState
) => void;

const mutations: { [key: string]: MutationFunction } = {
  hideSections: (newState: AppState) => {
    newState.sections = [];
  },
  showSection: (newState: AppState, payload: AppSection) => {
    if (!newState.sections.includes(payload)) {
      newState.sections.push(payload);
    }
  },
  hideSection: (newState: AppState, payload: AppSection) => {
    const sections = newState.sections.filter(section => section !== payload);
    newState.sections = sections;
  },
  setCutsceneState: (
    newState: AppState,
    payload: Partial<ICutsceneAppState>
  ) => {
    Object.assign(newState.cutscene, payload);
  },
  setArcadeGameState: (
    newState: AppState,
    payload: Partial<IArcadeCabinetState>
  ) => {
    Object.assign(newState.arcadeGame, payload);
  },
  setBattleState: (newState: AppState, payload: Partial<IBattleUiState>) => {
    Object.assign(newState.battle, payload);
  },
  setChoicesState: (newState: AppState, payload: Partial<IChoicesState>) => {
    Object.assign(newState.choices, payload);
  },
  setOverworldState: (
    newState: AppState,
    payload: Partial<IOverworldAppState>
  ) => {
    if (
      payload.characterText !== undefined &&
      payload.characterText !== newState.overworld.characterText
    ) {
      payload.prevCharacterText = newState.overworld.characterText;
    }

    Object.assign(newState.overworld, payload);
  },
  setModalState: (newState: AppState, payload: Partial<IModalState>) => {
    Object.assign(newState.modal, payload);
  },
  setSettingsState: (newState: AppState, payload: Partial<ISettingsState>) => {
    Object.assign(newState.settings, payload);
  },
  setSaveState: (newState: AppState, payload: Partial<ISaveState>) => {
    Object.assign(newState.save, payload);
  },
};

export const appReducer = function <T>(
  oldState: AppState,
  action: ReducerAction<T>
) {
  const newState = { ...oldState };
  const mutation = mutations[action.action];
  if (mutation) {
    mutation(newState, action.payload, oldState);
    console.log('MUTATE STATE', action);
  } else {
    console.error(
      `Action without a reducer mutation: "${action.action}"`,
      action
    );
  }
  return newState;
};

export const hideSections = () => {
  getUiInterface().dispatch({
    action: 'hideSections',
  });
};

export const showSection = (section: AppSection, hideRest: boolean) => {
  if (hideRest) {
    hideSections();
  }
  getUiInterface().dispatch({
    action: 'showSection',
    payload: section,
  });
};

export const showSections = (sections: AppSection[], hideRest: boolean) => {
  if (hideRest) {
    hideSections();
  }
  sections.forEach(section => {
    getUiInterface().dispatch({
      action: 'showSection',
      payload: section,
    });
  });
};

export const hideSection = (section: AppSection) => {
  const payload = section;
  getUiInterface().dispatch({
    action: 'hideSection',
    payload,
  });
};

export const hideConversation = () => {
  getUiInterface().dispatch({
    action: 'setCutsceneState',
    payload: {
      visible: false,
      // speaker: CutsceneSpeaker.None,
      portraitLeft: '',
      portraitLeft2: '',
      portraitRight: '',
      portraitRight2: '',
      portraitCenter: '',
      portraitLeftEmotion: '',
      portraitLeft2Emotion: '',
      portraitRightEmotion: '',
      portraitRight2Emotion: '',
      portraitCenterEmotion: '',
    } as Partial<ICutsceneAppState>,
  });
};

export const showConversation = () => {
  getUiInterface().dispatch({
    action: 'setCutsceneState',
    payload: {
      visible: true,
    } as Partial<ICutsceneAppState>,
  });
};

export const startConversation = (portrait: string, showBars: boolean) => {
  hideSection(AppSection.Debug);
  showSection(AppSection.Cutscene, false);
  getUiInterface().dispatch({
    action: 'setCutsceneState',
    payload: {
      showBars,
      portraitCenter: portrait,
      portraitLeft: '',
      portraitRight: '',
      portraitLeft2: '',
      portraitRight2: '',
      portraitLeftEmotion: '',
      portraitLeft2Emotion: '',
      portraitRightEmotion: '',
      portraitRight2Emotion: '',
      portraitCenterEmotion: '',
      speaker: CutsceneSpeaker.None,
      visible: true,
    } as Partial<ICutsceneAppState>,
  });
};

export const startConversation2 = (
  portraitLeft: string,
  portraitRight: string
) => {
  hideSection(AppSection.Debug);
  showSection(AppSection.Cutscene, false);
  getUiInterface().dispatch({
    action: 'setCutsceneState',
    payload: {
      showBars: true,
      portraitLeft,
      portraitRight,
      portraitLeft2: '',
      portraitRight2: '',
      portraitCenter: '',
      portraitLeftEmotion: '',
      portraitLeft2Emotion: '',
      portraitRightEmotion: '',
      portraitRight2Emotion: '',
      portraitCenterEmotion: '',
      speaker: CutsceneSpeaker.None,
      speakerName: '',
      visible: true,
    } as Partial<ICutsceneAppState>,
  });
};

export const setCutsceneText = (
  text: string,
  speaker?: CutsceneSpeaker,
  actorName?: string
) => {
  const payload = {
    text,
    visible: true,
    speakerName: '',
  } as Partial<ICutsceneAppState>;
  if (speaker) {
    payload.speaker = speaker;
    payload.speakerName = actorName;
  }
  getUiInterface().dispatch({
    action: 'setCutsceneState',
    payload,
  });
};

export const showArcadeGame = (path: ArcadeGamePath) => {
  const payload = {
    path,
    isGameRunning: false,
    isGameReady: false,
  };
  getUiInterface().dispatch({
    action: 'setArcadeGameState',
    payload,
  });
  showSection(AppSection.ArcadeCabinet, true);
};

export const setArcadeGameRunning = (v: boolean) => {
  const payload = {
    isGameRunning: v,
  };
  getUiInterface().dispatch({
    action: 'setArcadeGameState',
    payload,
  });
};

export const setArcadeGameReady = (v: boolean) => {
  const payload = {
    isGameReady: v,
  };
  getUiInterface().dispatch({
    action: 'setArcadeGameState',
    payload,
  });
};

export const hideArcadeGame = () => {
  const payload = {
    path: '',
    isGameRunning: false,
    isGameReady: false,
  };
  getUiInterface().dispatch({
    action: 'setArcadeGameState',
    payload,
  });
  showSection(AppSection.Debug, true);

  const overworld = getCurrentOverworld();
  overworldShow(overworld);
};

export const showChoices = (choices: string[]) => {
  showSection(AppSection.Choices, false);
  const payload = {
    choiceTexts: choices,
    keyHandlerInternal: pushEmptyKeyHandler(),
  };
  getUiInterface().dispatch({
    action: 'setChoicesState',
    payload,
  });
  playSoundName('menu_choice_open');
};

export const hideChoices = () => {
  const payload = AppSection.Choices;
  popKeyHandler(getUiInterface().appState.choices.keyHandlerInternal);
  getUiInterface().dispatch({
    action: 'hideSection',
    payload,
  });
};

export const setBattleCharacterIndexSelected = (ind: number) => {
  const payload = {
    characterIndexSelected: ind,
  };
  getUiInterface().dispatch({
    action: 'setBattleState',
    payload,
  });
};

export const setBattleCharacterSelectedAction = (
  bCh: BattleCharacter,
  index: number
) => {
  bCh.ch.skillIndex = index;
  renderUi();
};

export const setCharacterText = (text: string) => {
  const uiInterface = getUiInterface();
  if (uiInterface.appState.overworld.characterText === text) {
    return;
  }

  const payload: Partial<IOverworldAppState> = {
    characterText: text,
  };

  uiInterface.dispatch({
    action: 'setOverworldState',
    payload,
  });
};

export const showModal = (
  section: ModalSection,
  modalParams: {
    onClose: () => void;
    onConfirm?: () => void;
    text?: string;
  }
) => {
  const payload = {
    section,
    onClose: modalParams.onClose,
    onConfirm: modalParams.onConfirm,
    text: modalParams.text,
  };
  getUiInterface().dispatch({
    action: 'setModalState',
    payload,
  });
  showSection(AppSection.Modal, false);
};

export const showSettings = (onClose: () => void) => {
  playSoundName('menu_choice_open');
  const payload = {
    onClose,
  };
  getUiInterface().dispatch({
    action: 'setSettingsState',
    payload,
  });
  showSection(AppSection.Settings, false);
};

export const showSave = (onClose: () => void) => {
  playSoundName('menu_choice_open');
  const payload = {
    onClose,
  };
  getUiInterface().dispatch({
    action: 'setSaveState',
    payload,
  });
  showSection(AppSection.Save, false);
};
