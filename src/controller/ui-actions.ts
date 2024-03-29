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
  IRoomState,
  NotificationState,
  IQuestState,
  IItemStoreState,
  IInfoStats,
} from 'model/store';
import {
  ArcadeGamePath,
  getArcadeGamePathMeta,
} from 'view/components/ArcadeCabinet';
import {
  getCurrentOverworld,
  setOverworldUpdateKeysDisabled,
} from 'model/generics';
import { overworldHide, overworldShow } from 'model/overworld';
import { playMusic, playSoundName, stopCurrentMusic } from 'model/sound';
import { BattleCharacter } from 'model/battle-character';
import { popKeyHandler, pushEmptyKeyHandler } from './events';
import { Character, characterGetPortraitSpriteName } from 'model/character';
import { pause, unpause } from './loop';
import { Particle } from 'model/particle';
import { get as getStore } from 'db/stores';

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
  setQuestState: (newState: AppState, payload: Partial<IQuestState>) => {
    Object.assign(newState.quest, payload);
  },
  setStoreState: (newState: AppState, payload: Partial<IItemStoreState>) => {
    Object.assign(newState.store, payload);
  },
  setInfoStatsState: (newState: AppState, payload: Partial<IInfoStats>) => {
    Object.assign(newState.infoStats, payload);
  },
  addRoomUiParticle: (newState: AppState, payload: Particle) => {
    newState.room.particles = [...newState.room.particles, payload];
  },
  removeRoomUiParticle: (newState: AppState, payload: Particle) => {
    const ind = newState.room.particles.indexOf(payload);
    if (ind > -1) {
      newState.room.particles.splice(ind, 1);
    }
  },
  showNotification: (newState: AppState, payload: NotificationState) => {
    newState.notifications.push(payload);
  },
  hideNotification: (newState: AppState, payload: NotificationState) => {
    const ind = newState.notifications.indexOf(payload);
    if (ind > -1) {
      newState.notifications.splice(ind);
    }
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
  // console.trace('SHOW SECTION ' + section);
  const sections = getUiInterface().appState.sections;
  if (hideRest) {
    if (sections.length === 1 && sections[0] === section) {
      console.log(
        'Show section skipped because it would result in a redundant render.'
      );
      return;
    }
  }

  if (hideRest) {
    hideSections();
  }
  getUiInterface().dispatch({
    action: 'showSection',
    payload: {
      section,
      hideSections: sectionsToHide,
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
  setOverworldUpdateKeysDisabled(false);
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
      actorName: '',
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
  setOverworldUpdateKeysDisabled(true);
  showSection(AppSection.Cutscene, false, [AppSection.Debug, AppSection.Menu]);
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
  setOverworldUpdateKeysDisabled(true);
  showSection(AppSection.Cutscene, false, [AppSection.Debug, AppSection.Menu]);
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
  setOverworldUpdateKeysDisabled(true);
  showSection(AppSection.Cutscene, false, [AppSection.Debug, AppSection.Menu]);

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
  const payload = {
    path,
    isGameRunning: false,
    isGameReady: false,
  };
  getUiInterface().dispatch({
    action: 'setArcadeGameState',
    payload,
  });
  const meta = getArcadeGamePathMeta(path);
  setOverworldUpdateKeysDisabled(true);
  if (!meta?.cabinet?.music) {
    stopCurrentMusic(250);
  }

  if (meta?.cabinet?.disabled) {
    setInterfaceStateDisabled(true);
    showSection(AppSection.ArcadeCabinet, false);
  } else {
    overworldHide(getCurrentOverworld());
    pause();
    showSection(AppSection.ArcadeCabinet, true);
  }
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
  setInterfaceStateDisabled(false);

  setOverworldUpdateKeysDisabled(false);
  const overworld = getCurrentOverworld();
  overworldShow(overworld);

  if (overworld.music) {
    playMusic(overworld.music, true, 250);
  }
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
  popKeyHandler(getUiInterface().appState.choices.keyHandlerInternal);
  hideSection(AppSection.Choices);
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
    onConfirm?: (v?: any) => void | Promise<void>;
    body?: any;
    danger?: boolean;
    filter?: (a: any) => boolean;
    meta?: any;
  }
) => {
  const payload = {
    section,
    onClose: modalParams.onClose,
    onConfirm: modalParams.onConfirm,
    body: modalParams.body,
    danger: modalParams.danger ?? false,
    filter: modalParams.filter ?? (() => true),
    meta: modalParams.meta ?? {},
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
  onCharacterSelected: (ch: Character) => Promise<void>;
  filter?: (a: any) => boolean;
  showDelayInfo?: boolean;
  itemNameForDescription?: string;
  body?: any;
}) => {
  showModal(ModalSection.SELECT_PARTY_MEMBER, {
    onClose: props.onClose,
    onConfirm: props.onCharacterSelected,
    filter: props.filter,
    body: props.body,
    meta: {
      showDelayInfo: props.showDelayInfo,
      itemNameForDescription: props.itemNameForDescription,
    },
  });
};

export const showCharacterFollowerSelectModal = (props: {
  onClose: () => void;
  onCharacterSelected: (ch: Character) => Promise<void>;
  filter?: (a: any) => boolean;
  body?: any;
  characters: Character[];
  isAll?: boolean;
}) => {
  showModal(ModalSection.SELECT_CHARACTER_FOLLOWER, {
    onClose: props.onClose,
    onConfirm: props.onCharacterSelected,
    filter: props.filter,
    body: props.body,
    meta: {
      characters: props.characters,
      isAll: props.isAll,
    },
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

export const showQuestSection = (questName: string, onClose: () => void) => {
  const payload = {
    onClose,
    questName,
  };
  getUiInterface().dispatch({
    action: 'setQuestState',
    payload,
  });
  showSection(AppSection.Quest, false);
};

export const hideQuestSection = () => {
  hideSection(AppSection.Quest);
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

export const addRoomUiParticle = (particle: Particle) => {
  getUiInterface().dispatch({
    action: 'addRoomUiParticle',
    payload: particle,
  });
};

export const removeRoomUiParticle = (particle: Particle) => {
  const inter = getUiInterface();
  const state = inter.appState;
  const ind = state.room.particles.indexOf(particle);
  // prevents whole ui renders when non-ui particles are removed.
  if (ind > -1) {
    inter.dispatch({
      action: 'removeRoomUiParticle',
      payload: particle,
    });
  }
};

export const showNotification = (args: NotificationState) => {
  args.timeoutId = setTimeout(() => {
    getUiInterface().dispatch({
      action: 'hideNotification',
      payload: args,
    });
  }, 3000) as any;
  getUiInterface().dispatch({
    action: 'showNotification',
    payload: args,
  });
};

export const setInterfaceStateDisabled = (disabled: boolean) => {
  getUiInterface().dispatch({
    action: 'setOverworldState',
    payload: {
      interfaceDisabled: disabled,
    },
  });
};

export const showStoreSection = (storeName: string, onClose: () => void) => {
  const payload = {
    onClose,
    storeName,
  };

  const store = getStore(storeName);
  if (store.openSound) {
    playSoundName(store.openSound);
  } else {
    playSoundName('menu_choice_open');
  }

  getUiInterface().dispatch({
    action: 'setStoreState',
    payload,
  });
  showSection(AppSection.Store, false);
};

export const hideStoreSection = () => {
  const storeName = getUiInterface().appState.store.storeName;
  if (storeName) {
    const store = getStore(storeName);
    if (store.closeSound) {
      playSoundName(store.closeSound);
    } else {
      playSoundName('menu_choice_close');
    }
  }

  hideSection(AppSection.Store);
};

export const showInfoStatsSection = (onClose: () => void) => {
  const payload = {
    onClose,
  };
  getUiInterface().dispatch({
    action: 'setInfoStatsState',
    payload,
  });
  showSection(AppSection.InfoStats, false);
  playSoundName('menu_choice_open');
};

export const hideInfoStatsSection = () => {
  hideSection(AppSection.InfoStats);
  playSoundName('menu_choice_close');
};
