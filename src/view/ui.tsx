import { getCurrentBattle } from 'model/battle';
import { h, render } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import style from 'view/style';
import BattleCharacterButton from './components/BattleCharacterButton';

interface UIInterface {
  render: () => void;
}

const Wrapper: any = style('div', {});

export let uiInterface: UIInterface | null = null;

const App = () => {
  const [render, setRender] = useState(false);
  useEffect(() => {
    uiInterface = {
      render: () => {
        setRender(!render);
      },
    };
  });
  return (
    <Wrapper>
      <BattleCharacterButton bCh={getCurrentBattle().allies[0]} />
    </Wrapper>
  );
};

export const renderUi = (): void => {
  if (uiInterface) {
    uiInterface.render();
  }
};

export const mountUi = () => {
  const dom = document.getElementById('lower-ui');
  if (dom) {
    render(<App />, dom);
  }
};
