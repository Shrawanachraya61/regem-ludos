import { timeoutPromise } from 'utils';

enum ArcadeIframeMessage {
  HIDE_CONTROLS = 'HIDE_CONTROLS',
  SHOW_CONTROLS = 'SHOW_CONTROLS',
  MUTE_AUDIO = 'MUTE_AUDIO',
  UNMUTE_AUDIO = 'UNMUTE_AUDIO',
  BUTTON_DOWN = 'BUTTON_DOWN',
  BUTTON_UP = 'BUTTON_UP',
  SCALE_ORIGINAL = 'SCALE_ORIGINAL',
  SCALE_WINDOW = 'SCALE_WINDOW',
}

const arcadeIframeId = 'arcade-iframe';
const origin = window.location.origin;

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
