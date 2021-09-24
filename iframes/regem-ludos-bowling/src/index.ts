import { Game, Events } from './game';
import { mountUi } from './ui';
import pubSub from './pubsub';
const { subscribe } = pubSub;

const globalWindow = window as any;

const getLib = () => {
  return globalWindow.Lib;
};

// Obligatory Lib boilerplate for regem-ludos
globalWindow.init = async (config: { params: URLSearchParams }) => {
  console.log('Init from Lib', config);
  globalWindow.game = new Game();

  if (config.params.get('cabinet')) {
    document.body.style.background = 'none transparent';
    const canvasArea = document.getElementById('canvas-area');
    if (canvasArea) {
      canvasArea.style['margin-right'] = '315px';
    }

    globalWindow.game.cabinet = true;
  }

  mountUi();
};
subscribe(Events.GAME_LOAD_COMPLETED, () => {
  getLib().notifyGameReady();
  globalWindow.Module.jsLoaded();

  // starting it so it grabs controls focus right away
  getLib().notifyGameStarted();
});
globalWindow.start = () => {
  console.log('Start from Lib');
  getLib().notifyGameStarted();
};
subscribe(Events.GAME_STARTED, () => {
  globalWindow.start();
});
globalWindow.end = (score: number) => {
  console.log('End send to Lib');
  getLib().disableModuleControls();
  getLib().notifyGameCompleted(score);
};
subscribe(Events.GAME_TO_MENU, (score: number) => {
  globalWindow.end(score);
});
