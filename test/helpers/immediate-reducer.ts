import { appReducer } from 'controller/ui-actions';
import { AppStateInitial } from 'model/store';
import { setUiInterface } from 'view/ui';

export const initAppStateReducers = () => {
  setUiInterface(
    ((window as any).uiInterface = {
      appState: AppStateInitial,
      render: () => {},
      dispatch: ({ action, payload }) => {
        const newState = appReducer(getAppState(), { action, payload });
        (window as any).uiInterface.appState = newState;
      },
    })
  );
};

export const getAppState = () => {
  return (window as any).uiInterface.appState;
};
