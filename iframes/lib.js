function LIB() {
  const config = {
    startButtonEnabled: true,
    soundEnabled: true,
    shouldShowControls: true,
    originalScale: false,
    gameStarted: false,
  };

  this.BUTTON_LEFT = 1073741904;
  this.BUTTON_RIGHT = 1073741903;
  this.BUTTON_UP = 1073741906;
  this.BUTTON_DOWN = 1073741905;
  this.BUTTON_SHIFT = 1073742049;
  this.BUTTON_ENTER = 13;
  this.BUTTON_SPACE = 32;

  this.toggleSound = function () {
    if (config.soundEnabled) {
      console.log('[IFRAME] Disable sound');
      Module.ccall('disableSound');
    } else {
      console.log('[IFRAME] Enabled sound');
      Module.ccall('enableSound');
    }
    config.soundEnabled = !config.soundEnabled;
  };
  this.toggleScale = function () {
    const board = document.getElementById('board');
    const canvas = document.getElementById('canvas');
    if (config.originalScale) {
      board.className = 'board';
      canvas.className = '';
    } else {
      board.className = 'board-original';
      canvas.className = 'canvas-original';
    }
    config.originalScale = !config.originalScale;
  };
  this.toggleControls = function () {
    if (config.shouldShowControls) {
      this.hideControls();
    } else {
      this.showControls();
    }
    config.shouldShowControls = !config.shouldShowControls;
  };
  this.hideLoading = function () {
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'none';
    const game = document.getElementById('game');
    if (game) game.style.display = 'flex';
    const error = document.getElementById('error');
    if (error) error.style.display = 'none';
  };
  this.showError = function () {
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'none';
    const game = document.getElementById('game');
    if (game) game.style.display = 'none';
    const error = document.getElementById('error');
    if (error) error.style.display = 'flex';
  };
  this.hideControls = function () {
    const top = document.getElementById('top-bar-controls');
    if (top) top.style.display = 'none';
    const controls = document.getElementById('on-screen-controls');
    if (controls) controls.style.display = 'none';
  };
  this.showControls = function () {
    const top = document.getElementById('top-bar-controls');
    if (top) top.style.display = 'flex';
    const controls = document.getElementById('on-screen-controls');
    if (controls) controls.style.display = 'flex';
  };
  this.handleButtonDown = function (key) {
    Module.ccall('setKeyDown', 'void', ['number'], [key]);
  };
  this.handleButtonUp = function (key) {
    Module.ccall('setKeyUp', 'void', ['number'], [key]);
  };
  this.disableModuleControls = function () {
    Module.ccall('setKeyStatus', 'void', ['number'], [0]);
  };
  this.enableModuleControls = function () {
    Module.ccall('setKeyStatus', 'void', ['number'], [1]);
  };

  this.notifyParentFrame = function (action, payload) {
    if (window.parent) {
      console.log('[IFRAME] Notify parent', action);
      window.parent.postMessage(
        JSON.stringify({
          action,
          payload,
        })
      );
    } else {
      console.log('[IFRAME] No parent to notify.');
    }
  };

  this.notifyGameReady = function () {
    this.notifyParentFrame('GAME_READY', {});
  };

  this.notifyGameStarted = function () {
    this.notifyParentFrame('GAME_STARTED', {});
    config.gameStarted = true;
  };

  this.notifyGameCompleted = function (result) {
    this.notifyParentFrame('GAME_CONCLUDED', result);
    config.gameStarted = false;
  };

  this.notifyGameCancelled = function () {
    this.notifyParentFrame('GAME_CANCELLED', {});
    config.gameStarted = false;
  };

  const SOUND_PATH = '';
  const sounds = {};

  this.loadSound = async function (name, url) {
    url = `${SOUND_PATH}${url}`;
    return new Promise((resolve, reject) => {
      const sound = new Audio(url);
      sound.autoplay = false;
      const onLoad = () => {
        sound.oncanplay = null;
        sound.currentTime = 99999999999;
        const soundDuration = sound.currentTime;
        sound.currentTime = 0;
        sound.onended = function () {
          sound.pause();
          sound.currentTime = 0;
        };
        sounds[name] = {
          sound,
          audio: sound,
          soundDuration,
        };
        console.log('[IFRAME] sound loaded', name, url);
        clearTimeout(timeoutId);
        resolve(sound);
      };
      sound.oncanplay = sound.onloadeddata = onLoad;
      const timeoutId = setTimeout(() => {
        console.error('[IFRAME] Sound load timed out:', name, url);
        onLoad();
      }, 3000);

      sound.addEventListener('error', e => {
        console.error('sound error', e);
        reject(
          '[IFRAME] Cannot load sound: name="' + name + '", url="' + url + '"'
        );
      });
      sound.src = url;
    });
  };

  this.getSound = function (soundName) {
    const soundObj = sounds[soundName];
    if (soundObj) {
      const s = {
        duration: 0,
        ...soundObj,
        //soundDuration merged in from soundObj
        audio: soundObj.audio.cloneNode(),
        soundName,
        lastStartTimestamp: window.performance.now(),
        isPlaying: false,
        isPaused: false,
      };

      return s;
    } else {
      console.error('Could not find sound with name: ', soundName);
      return null;
    }
  };

  this.playSound = function (soundObj) {
    if (!config.soundEnabled) {
      return;
    }
    const { sound } = soundObj;
    sound.play();
    soundObj.lastStartTimestamp = window.performance.now();
    soundObj.isPlaying = true;
  };

  this.playSoundName = function (soundName) {
    const soundObj = this.getSound(soundName);
    if (soundObj) {
      this.playSound(soundObj);
    }
  };

  this.stopSound = function (soundObj) {
    const { sound } = soundObj;
    sound.pause();
    sound.currentTime = 0;
    soundObj.isPlaying = false;
  };

  this.setVolume = function (v) {
    for (let i in sounds) {
      const { audio } = sounds[i];
      audio.volume = v;
    }
  };

  this.getConfig = function () {
    return config;
  };
}

var Lib = (window.Lib = new LIB());

var Module = {
  arguments: ['--nointro'],
  jsLoaded: function () {
    Module.preRun[0]();
  },
  preRun: [
    function () {
      Lib.hideLoading();
      clearTimeout(window.loadTimeout);
    },
  ],
  postRun: [
    function () {
      var shouldMute = params.get('mute');
      if (shouldMute === 'true') {
        Lib.getConfig().soundEnabled = true;
        Lib.toggleSound();
      }
      var isArcadeCabinet = expand === 'true';
      if (isArcadeCabinet) {
        Lib.disableModuleControls();
      }
      // This should be notified from inside the program itself
      // Lib.notifyGameReady();
    },
  ],
  canvas: (function () {
    const canvas = document.getElementById('canvas');
    if (canvas) {
      canvas.addEventListener(
        'webglcontextlost',
        function (e) {
          console.error(
            '[IFRAME] WebGL context lost. You will need to reload the page.'
          );
          Lib.showError();
          e.preventDefault();
        },
        false
      );
    }

    return canvas;
  })(),
  onAbort: function () {
    console.error('[IFRAME] Program encountered an unknown error.');
    Lib.showError();
  },
  totalDependencies: 0,
  ccall: function () {},
};

window.addEventListener(
  'keydown',
  ev => {
    if (ev.key === 'F5') {
      window.location.reload();
    }
  },
  true
);

window.addEventListener('message', event => {
  try {
    const data = JSON.parse(event.data);
    if (data.action === 'HIDE_CONTROLS') {
      Lib.getConfig().shouldShowControls = true;
      Lib.toggleControls();
    } else if (data.action === 'SHOW_CONTROLS') {
      Lib.getConfig().shouldShowControls = false;
      Lib.toggleControls();
    } else if (data.action === 'SCALE_ORIGINAL') {
      Lib.getConfig().originalScale = false;
      Lib.toggleScale();
    } else if (data.action === 'SCALE_WINDOW') {
      Lib.getConfig().originalScale = true;
      Lib.toggleScale();
    } else if (data.action === 'MUTE_AUDIO') {
      Lib.getConfig().soundEnabled = true;
      Lib.toggleSound();
    } else if (data.action === 'UNMUTE_AUDIO') {
      Lib.getConfig().soundEnabled = false;
      Lib.toggleSound();
    } else if (data.action === 'BUTTON_DOWN') {
      Lib.handleButtonDown(data.payload);
    } else if (data.action === 'BUTTON_UP') {
      Lib.handleButtonUp(data.payload);
    } else if (data.action === 'BEGIN_GAME') {
      if (window.start) {
        window.start();
      } else {
        console.error(
          'Error, cannot BEGIN_GAME no "start" function found on window'
        );
      }
    }
  } catch (e) {
    console.warn('[IFRAME] Error on postMessage handler', e, event.data);
  }
});
// required for wasm to grab keyboard controls
setInterval(() => {
  if (Lib.getConfig().gameStarted) {
    window.focus();
  }
}, 500);

async function localInit() {
  window.loadTimeout = setTimeout(function () {
    console.error('[IFRAME] Content took too long to load.');
    Lib.showError();
  }, 30000);
  await window.init();
}

function verify() {
  if (!window.init) {
    console.error('[IFRAME] no `init` found.');
  }
  if (!window.start) {
    console.error('[IFRAME] no `start` found.');
  }
}
verify();

var queryString = window.location.search;
var params = new URLSearchParams(queryString);
var expand = params.get('cabinet');
if (expand === 'true') {
  Lib.getConfig().shouldShowControls = true;
  const startButton = document.getElementById('start');
  Lib.getConfig().startButtonEnabled = false;
  if (startButton) startButton.style.display = 'none';
  window.addEventListener('load', () => {
    console.log('[IFRAME] loaded Lib');
    Lib.toggleControls();
    Lib.toggleScale();
    var toggleScaleElem = document.getElementById('toggle-scale');
    if (toggleScaleElem) toggleScaleElem.style.display = 'none';
    var toggleSoundElem = document.getElementById('toggle-sound');
    if (toggleSoundElem) toggleSoundElem.style.display = 'none';
  });
}

var tapToStart = params.get('tap');
if (tapToStart === 'true') {
  var div = document.createElement('div');
  var loadingElem = document.getElementById('loading');
  if (loadingElem) {
    loadingElem.style.display = 'none';
  }
  window.onTapToStart = function () {
    if (loadingElem) {
      loadingElem.style.display = 'flex';
    }
    div.style.display = 'none';
    localInit();
  };
  div.innerHTML = 'Tap to Start';
  div.className = 'tap-to-start';
  div.onclick = window.onTapToStart;
  document.body.appendChild(div);
} else {
  try {
    localInit();
  } catch (e) {
    console.error(
      '[IFRAME] Error calling window.init function, is it defined for this program?'
    );
    throw e;
  }
}
