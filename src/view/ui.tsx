import { h, render } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import style from 'view/style';

interface UIInterface {
  render: () => void;
}

const Wrapper: any = style('div', {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  width: '14',
  height: '14',
  backgroundColor: 'orange',
});

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
      <div> This is the ui div </div>
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
