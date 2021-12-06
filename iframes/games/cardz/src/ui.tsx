// eslint-disable-next-line
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';

import BlackJackApp from './components/BlackJackApp';

export const mountUi = () => {
  const elem = document.getElementById('root');
  if (elem) {
    ReactDOM.render(<App />, elem);
  }
};

export const App = () => {
  return (
    <div>
      <BlackJackApp />
    </div>
  );
};
