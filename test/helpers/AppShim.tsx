import { h } from 'preact';
import { appReducer } from 'controller/ui-actions';
import { AppStateInitial } from 'model/store';
import { useReducer, useState } from 'preact/hooks';
import { setUiInterface } from 'view/ui';

export const AppShim = props => {
  const [render, setRender] = useState(false);
  const [appState, dispatch] = useReducer(appReducer, AppStateInitial);
  setUiInterface(
    ((window as any).uiInterface = {
      appState,
      render: () => {
        setRender(!render);
      },
      dispatch,
    })
  );

  return <div id="app-root">{props.children}</div>;
};
