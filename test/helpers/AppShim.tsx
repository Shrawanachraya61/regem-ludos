import { h } from 'preact';
import { appReducer } from 'controller/ui-actions';
import { AppState, AppStateInitial } from 'model/store';
import { useReducer, useState } from 'preact/hooks';
import { setUiInterface } from 'view/ui';

export const AppShim = (props: { state?: AppState; children?: any }) => {
  const [render, setRender] = useState(false);
  const [appState, dispatch] = useReducer(
    appReducer,
    props.state ?? AppStateInitial
  );
  setUiInterface(
    ((window as any).uiInterface = {
      appState,
      render: () => {
        setRender(!render);
      },
      dispatch,
    })
  );

  return <div id="test-app-root">{props.children}</div>;
};
