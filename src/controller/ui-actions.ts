import { getUiInterface } from 'view/ui';
import {
  AppState,
  AppSection,
  ICutsceneAppState,
  CutsceneSpeaker,
} from 'model/store';

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
  battleSetChButtonsStatus: (newState: AppState, payload: boolean) => {
    newState.battle.chButtonsEnabled = payload;
  },
  hideSections: (newState: AppState) => {
    newState.sections = [];
  },
  showSection: (newState: AppState, payload: AppSection) => {
    if (!newState.sections.includes(payload)) {
      newState.sections.push(payload);
    }
  },
  setCutsceneState: (
    newState: AppState,
    payload: Partial<ICutsceneAppState>
  ) => {
    Object.assign(newState.cutscene, payload);
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
  } else {
    console.error(
      `Action without a reducer mutation: "${action.action}"`,
      action
    );
  }
  return newState;
};

export const battleSetChButtonsStatus = (status: boolean) => {
  getUiInterface().dispatch({
    action: 'battleSetChButtonsStatus',
    payload: status,
  });
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

export const startConversation = (portrait: string) => {
  showSection(AppSection.Cutscene, true);
  getUiInterface().dispatch({
    action: 'setCutsceneState',
    payload: {
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
  showSection(AppSection.Cutscene, true);
  getUiInterface().dispatch({
    action: 'setCutsceneState',
    payload: {
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
      visible: true,
    } as Partial<ICutsceneAppState>,
  });
};

export const setCutsceneText = (text: string, speaker?: CutsceneSpeaker) => {
  const payload = {
    text,
    visible: true,
  } as Partial<ICutsceneAppState>;
  if (speaker) {
    payload.speaker = speaker;
  }
  getUiInterface().dispatch({
    action: 'setCutsceneState',
    payload,
  });
};
