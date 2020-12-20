import { getUiInterface } from 'view/ui';
import { AppState, AppSection } from 'model/store';

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
