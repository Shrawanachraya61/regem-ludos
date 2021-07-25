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
  IMenuState,
  ILevelUpState,
} from 'model/store';
import { ArcadeGamePath } from 'view/components/ArcadeCabinet';
import { getCurrentOverworld } from 'model/generics';
import { overworldShow } from 'model/overworld';
import { playSoundName } from 'model/sound';
import { BattleCharacter } from 'model/battle-character';
import { popKeyHandler, pushEmptyKeyHandler } from './events';
import { Character, characterGetPortraitSpriteName } from 'model/character';
import { pause, unpause } from './loop';

export interface ReducerAction<T> {
  action: string;
  payload: T;
}

type MutationFunction = (
  newState: AppState,
  payload?: any,
  oldState?: AppState
) => void;

const resolvers: { [key: string]: MutationFunction } = {
  hideSections: (newState: AppState) => {
    newState.sections = [];
  },
  showSection: (
    newState: AppState,
    payload: { section: AppSection; hideSections?: AppSection[] }
  ) => {
    if (!newState.sections.includes(payload.section)) {
      newState.sections.push(payload.section);
    }

    const sectionsToHide = payload.hideSections ?? [];
    newState.sections = newState.sections.filter(section => {
      return !sectionsToHide.includes(section);
    });
  },
  hideSection: (newState: AppState, payload: { section: AppSection }) => {
    const sections = newState.sections.filter(
      section => section !== payload.section
    );
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
  setMenuState: (newState: AppState, payload: Partial<IMenuState>) => {
    Object.assign(newState.menu, payload);
  },
  setSettingsState: (newState: AppState, payload: Partial<ISettingsState>) => {
    Object.assign(newState.settings, payload);
  },
  setSaveState: (newState: AppState, payload: Partial<ISaveState>) => {
    Object.assign(newState.save, payload);
  },
  setLevelUpState: (newState: AppState, payload: Partial<ILevelUpState>) => {
    Object.assign(newState.levelUp, payload);
  },
};

export const appReducer = function <T>(
  oldState: AppState,
  action: ReducerAction<T>
) {
  const newState = { ...oldState };
  const mutation = resolvers[action.action];
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

export const showSection = (
  section: AppSection,
  hideRest: boolean,
  sectionsToHide?: AppSection[]
) => {
  if (hideRest) {
    hideSections();
  }
  getUiInterface().dispatch({
    action: 'showSection',
    payload: {
      section,
      sectionsToHide,
    },
  });
};

export const showSections = (sections: AppSection[], hideRest: boolean) => {
  if (hideRest) {
    hideSections();
  }
  sections.forEach(section => {
    getUiInterface().dispatch({
      action: 'showSection',
      payload: { section },
    });
  });
};

export const hideSection = (section: AppSection) => {
  const payload = { section };
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
      actors: [],
      portraitActors: [],
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
  showSection(AppSection.Cutscene, false, [AppSection.Debug]);
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
      actors: [],
      portraitActors: [],
    } as Partial<ICutsceneAppState>,
  });
};

export const startConversation2 = (
  portraitLeft: string,
  portraitRight: string
) => {
  showSection(AppSection.Cutscene, false, [AppSection.Debug]);
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
      actors: [],
      portraitActors: [],
    } as Partial<ICutsceneAppState>,
  });
};

// start a conversation where all actors without portraits have a character follower component on them
export const startConversationActors = (
  actors: Character[],
  showBars: boolean
) => {
  showSection(AppSection.Cutscene, false, [AppSection.Debug]);

  const actorsWithPortraits = actors.filter(
    ch => !!characterGetPortraitSpriteName(ch)
  );
  const actorsWithoutPortraits = actors.filter(
    ch => !characterGetPortraitSpriteName(ch)
  );

  console.log('set actors', actorsWithPortraits, actorsWithoutPortraits);

  getUiInterface().dispatch({
    action: 'setCutsceneState',
    payload: {
      showBars,
      portraitCenter: 'ada', // not sure why this is necessary to get it to animate correctly
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
      actorName: '',
      visible: true,
      actors: actorsWithoutPortraits,
      portraitActors: actorsWithPortraits,
    } as Partial<ICutsceneAppState>,
  });
};

export const setCutsceneText = (
  text: string,
  speaker?: CutsceneSpeaker,
  actorNameLabel?: string,
  actorName?: string
) => {
  if (text) {
    const elem = document.getElementById('cutscene-textbox-content');
    if (elem) {
      elem.innerHTML = '';
    }
  }
  const payload = {
    text,
    visible: true,
    speakerName: '',
    id: String(+new Date()),
  } as Partial<ICutsceneAppState>;
  if (speaker) {
    payload.speaker = speaker;
    payload.actorName = actorName ?? '';
    payload.speakerName = actorNameLabel;
  }
  getUiInterface().dispatch({
    action: 'setCutsceneState',
    payload,
  });
};

export const showArcadeGame = (path: ArcadeGamePath) => {
  pause();
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
  unpause();
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
    onConfirm?: (v?: any) => void;
    body?: any;
    danger?: boolean;
    filter?: (a: any) => boolean;
  }
) => {
  console.log('SHOW MODAL', section, modalParams);
  const payload = {
    section,
    onClose: modalParams.onClose,
    onConfirm: modalParams.onConfirm,
    body: modalParams.body,
    danger: modalParams.danger ?? false,
    filter: modalParams.filter ?? (() => true),
  };
  getUiInterface().dispatch({
    action: 'setModalState',
    payload,
  });
  showSection(AppSection.Modal, false);
};

export const hideModal = () => {
  hideSection(AppSection.Modal);
};

export const showPartyMemberSelectModal = (props: {
  onClose: () => void;
  onCharacterSelected: (ch: Character) => void;
  filter?: (a: any) => boolean;
}) => {
  showModal(ModalSection.SELECT_PARTY_MEMBER, {
    onClose: props.onClose,
    onConfirm: props.onCharacterSelected,
    filter: props.filter,
  });
};

export const showMenu = (onClose: () => void) => {
  playSoundName('menu_choice_open');
  const payload = {
    onClose,
  };
  getUiInterface().dispatch({
    action: 'setMenuState',
    payload,
  });
  showSection(AppSection.Menu, false);
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

export const showLevelUp = (onClose: () => void) => {
  playSoundName('blip');
  const payload = {
    onClose,
  };
  getUiInterface().dispatch({
    action: 'setLevelUpState',
    payload,
  });
  showSection(AppSection.LevelUp, false);
};

export const showBattleEffect = (
  bChList: BattleCharacter[],
  effectAnimName: string
) => {
  const payload = {
    effect: {
      bChList,
      effectAnimName,
      active: true,
    },
  };
  console.log('SHOW BATTLE EFFECT', effectAnimName);
  getUiInterface().dispatch({
    action: 'setBattleState',
    payload,
  });
};

export const hideBattleEffect = () => {
  const payload = {
    effect: {
      active: false,
      effectAnimName: '',
      bChList: [],
    },
  };
  getUiInterface().dispatch({
    action: 'setBattleState',
    payload,
  });
};
