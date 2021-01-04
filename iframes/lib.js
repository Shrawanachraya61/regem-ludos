var soundEnabled = true;
function toggleSound() {
  if (soundEnabled) {
    console.log('Disable sound');
    Module.ccall('disableSound');
  } else {
    console.log('Enabled sound');
    Module.ccall('enableSound');
  }
  soundEnabled = !soundEnabled;
}
var originalScale = false;
function toggleScale() {
  const board = document.getElementById('board');
  const canvas = document.getElementById('canvas');
  if (originalScale) {
    board.className = 'board';
    canvas.className = '';
  } else {
    board.className = 'board-original';
    canvas.className = 'canvas-original';
  }
  originalScale = !originalScale;
}
var shouldShowControls = true;
function toggleControls() {
  if (shouldShowControls) {
    hideControls();
  } else {
    showControls();
  }
  shouldShowControls = !shouldShowControls;
}
function hideLoading() {
  const loading = document.getElementById('loading');
  if (loading) loading.style.display = 'none';
  const game = document.getElementById('game');
  if (game) game.style.display = 'flex';
  const error = document.getElementById('error');
  if (error) error.style.display = 'none';
}
function showError() {
  const loading = document.getElementById('loading');
  if (loading) loading.style.display = 'none';
  const game = document.getElementById('game');
  if (game) game.style.display = 'none';
  const error = document.getElementById('error');
  if (error) error.style.display = 'flex';
}
function hideControls() {
  const top = document.getElementById('top-bar-controls');
  if (top) top.style.display = 'none';
  const controls = document.getElementById('on-screen-controls');
  if (controls) controls.style.display = 'none';
}
function showControls() {
  const top = document.getElementById('top-bar-controls');
  if (top) top.style.display = 'flex';
  const controls = document.getElementById('on-screen-controls');
  if (controls) controls.style.display = 'flex';
}
function handleButtonDown(key) {
  Module.ccall('setKeyDown', 'void', ['number'], [key]);
}
function handleButtonUp(key) {
  Module.ccall('setKeyUp', 'void', ['number'], [key]);
}
var Module = {
  jsLoaded: function () {
    Module.preRun[0]();
  },
  preRun: [
    function () {
      hideLoading();
      clearTimeout(window.loadTimeout);
    },
  ],
  postRun: [
    function () {
      var shouldMute = params.get('mute');
      if (shouldMute === 'true') {
        soundEnabled = true;
        toggleSound();
      }
    },
  ],
  canvas: (function () {
    const canvas = document.getElementById('canvas');
    canvas.addEventListener(
      'webglcontextlost',
      function (e) {
        console.error(
          '[IFRAME] WebGL context lost. You will need to reload the page.'
        );
        showError();
        e.preventDefault();
      },
      false
    );

    return canvas;
  })(),
  onAbort: function () {
    console.error('[IFRAME] Program encountered an unknown error.');
    showError();
  },
  totalDependencies: 0,
};
// required by the wasm, called when the game ends and there was a high score
var notifyHighScore = function (n) {
  console.log('Got notified of high score', n);
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
      shouldShowControls = true;
      toggleControls();
    } else if (data.action === 'SHOW_CONTROLS') {
      shouldShowControls = false;
      toggleControls();
    } else if (data.action === 'SCALE_ORIGINAL') {
      originalScale = false;
      toggleScale();
    } else if (data.action === 'SCALE_WINDOW') {
      originalScale = true;
      toggleScale();
    } else if (data.action === 'MUTE_AUDIO') {
      soundEnabled = true;
      toggleSound();
    } else if (data.action === 'UNMUTE_AUDIO') {
      soundEnabled = false;
      toggleSound();
    } else if (data.action === 'BUTTON_DOWN') {
      handleButtonDown(data.payload);
    } else if (data.action === 'BUTTON_UP') {
      handleButtonUp(data.payload);
    }
  } catch (e) {
    console.warn('[IFRAME] Error on postMessage handler', e, event.data);
  }
});
// required for wasm to grab keyboard controls
setInterval(() => {
  window.focus();
}, 500);

function localInit() {
  window.loadTimeout = setTimeout(function () {
    console.error('[IFRAME] Content took too long to load.');
    showError();
  }, 30000);
  window.init();
}

var queryString = window.location.search;
var params = new URLSearchParams(queryString);
var expand = params.get('cabinet');
if (expand === 'true') {
  shouldShowControls = true;
  toggleControls();
  toggleScale();
  var toggleScaleElem = document.getElementById('toggle-scale');
  if (toggleScaleElem) toggleScaleElem.style.display = 'none';
  var toggleSoundElem = document.getElementById('toggle-sound');
  if (toggleSoundElem) toggleSoundElem.style.display = 'none';
}

var tapToStart = params.get('tap');
if (tapToStart === 'true') {
  var div = document.createElement('div');
  var loading = document.getElementById('loading');
  if (loading) {
    loading.style.display = 'none';
  }
  window.onTapToStart = function () {
    if (loading) {
      loading.style.display = 'flex';
    }
    div.style.display = 'none';
    localInit();
  };
  div.innerHTML = 'tap to start';
  div.className = 'tap-to-start';
  div.onclick = window.onTapToStart;
  document.body.appendChild(div);
} else {
  //must be defined inside the html file
  try {
    localInit();
  } catch (e) {
    console.error(
      '[IFRAME] Error calling init function, is it defined for this program?'
    );
    throw e;
  }
}
