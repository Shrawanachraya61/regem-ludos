import { getCurrentScene } from 'model/generics';
import { timeoutPromise } from 'utils';
import { getUiInterface } from 'view/ui';
import { createAndCallScript } from './scene-management';
import { setArcadeGameReady, setArcadeGameRunning } from './ui-actions';
import { getArcadeGamePathMeta } from 'view/components/ArcadeCabinet';

enum ArcadeIframeMessage {
  HIDE_CONTROLS = 'HIDE_CONTROLS',
  SHOW_CONTROLS = 'SHOW_CONTROLS',
  MUTE_AUDIO = 'MUTE_AUDIO',
  UNMUTE_AUDIO = 'UNMUTE_AUDIO',
  BUTTON_DOWN = 'BUTTON_DOWN',
  BUTTON_UP = 'BUTTON_UP',
  SCALE_ORIGINAL = 'SCALE_ORIGINAL',
  SCALE_WINDOW = 'SCALE_WINDOW',
  BEGIN_GAME = 'BEGIN_GAME',
}

enum ArcadeIframeResponseMessage {
  GAME_READY = 'GAME_READY',
  GAME_STARTED = 'GAME_STARTED',
  GAME_CONCLUDED = 'GAME_CONCLUDED',
  GAME_CANCELLED = 'GAME_CANCELLED',
  RUN_RPGSCRIPT = 'RUN_RPGSCRIPT',
}

const arcadeIframeId = 'arcade-iframe';
const origin = window.location.origin;

const parseJsonWithTryCatch = (data: string) => {
  try {
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
};

window.addEventListener('message', async event => {
  const data = parseJsonWithTryCatch(event.data);

  if (!data) {
    return;
  }

  if (data.action === ArcadeIframeResponseMessage.GAME_READY) {
    console.log('game ready');
    setArcadeGameReady(true);
  } else if (data.action === ArcadeIframeResponseMessage.GAME_STARTED) {
    setArcadeGameRunning(true);
    console.log('game started');
  } else if (data.action === ArcadeIframeResponseMessage.GAME_CONCLUDED) {
    console.log('game concluded', data.payload);
    window.focus();
    const path = getUiInterface().appState.arcadeGame.path;
    if (path) {
      const meta = getArcadeGamePathMeta(path);
      if (meta?.onGameCompleted) {
        await meta?.onGameCompleted(data.payload);
      }
    }
    setArcadeGameRunning(false);
  } else if (data.action === ArcadeIframeResponseMessage.GAME_CANCELLED) {
    console.log('game cancelled');
    setArcadeGameRunning(false);
  } else if (data.action === ArcadeIframeResponseMessage.RUN_RPGSCRIPT) {
    console.log('run rpgscript from iframe', data.payload);
    createAndCallScript(getCurrentScene(), data.payload.scriptSrc);
  } else {
    console.error(
      'Got message event listener with invalid action',
      data.action
    );
  }
});

const getIframeWindow = async () => {
  const elem = document.getElementById(arcadeIframeId);
  if (elem) {
    const iframe = elem as HTMLIFrameElement;
    if (!iframe.contentWindow) {
      for (let i = 0; i < 100; i++) {
        await timeoutPromise(33);
        if (iframe.contentWindow) {
          break;
        }
      }
    }
    return iframe.contentWindow;
  }
  console.error('Cannot get iframe contentWindow.');
  return null;
};

const postMessage = async (
  contentWindow: Window,
  message: { action: ArcadeIframeMessage; payload?: string | number }
) => {
  contentWindow.postMessage(JSON.stringify(message), origin);
};

export const hideControls = async () => {
  const contentWindow = await getIframeWindow();
  if (contentWindow) {
    postMessage(contentWindow, {
      action: ArcadeIframeMessage.HIDE_CONTROLS,
    });
  }
};

export const showControls = async () => {
  const contentWindow = await getIframeWindow();
  if (contentWindow) {
    postMessage(contentWindow, {
      action: ArcadeIframeMessage.SHOW_CONTROLS,
    });
  }
};

export const muteAudio = async () => {
  const contentWindow = await getIframeWindow();
  if (contentWindow) {
    postMessage(contentWindow, {
      action: ArcadeIframeMessage.MUTE_AUDIO,
    });
  }
};

export const unmuteAudio = async () => {
  const contentWindow = await getIframeWindow();
  if (contentWindow) {
    postMessage(contentWindow, {
      action: ArcadeIframeMessage.UNMUTE_AUDIO,
    });
  }
};

export const setButtonDown = async (key: number) => {
  const contentWindow = await getIframeWindow();
  if (contentWindow) {
    postMessage(contentWindow, {
      action: ArcadeIframeMessage.BUTTON_DOWN,
      payload: key,
    });
  }
};

export const setButtonUp = async (key: number) => {
  const contentWindow = await getIframeWindow();
  if (contentWindow) {
    postMessage(contentWindow, {
      action: ArcadeIframeMessage.BUTTON_UP,
      payload: key,
    });
  }
};

export const setScaleOriginal = async () => {
  const contentWindow = await getIframeWindow();
  if (contentWindow) {
    postMessage(contentWindow, {
      action: ArcadeIframeMessage.SCALE_ORIGINAL,
    });
  }
};

export const setScaleWindow = async () => {
  const contentWindow = await getIframeWindow();
  if (contentWindow) {
    postMessage(contentWindow, {
      action: ArcadeIframeMessage.SCALE_WINDOW,
    });
  }
};

export const beginCurrentArcadeGame = async () => {
  const contentWindow = await getIframeWindow();
  if (contentWindow) {
    postMessage(contentWindow, {
      action: ArcadeIframeMessage.BEGIN_GAME,
    });
  }
};
