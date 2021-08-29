let nowMs = 0;
let nowDt = 0;
// let started = false;
let loopCb: any = null;
let looping = false;

// const getNowDt = () => view_nowDt;
let frameTime = +new Date();
const FRAME_TIME_MAX = 1000;

const PI = Math.PI;

const updateGlobalFrameTime = () => {
  const dt = nowMs - frameTime;
  if (dt > FRAME_TIME_MAX) {
    frameTime = +new Date();
  }
};

const getFrameTimePercentage = () => {
  return Math.min(
    Math.max(
      getShared().normalize(nowMs, frameTime, frameTime + FRAME_TIME_MAX, 0, 1),
      0
    ),
    1
  );
};

const startRenderLoop = () => {
  let now = +new Date();
  let prevNow = now;
  loop(() => {
    const gameData = getGameData();
    if (gameData) {
      now = +new Date();
      const nowDt = now - prevNow;
      prevNow = now;
      getShared().simulate(gameData, { nowDt });
      drawSimulation(gameData);
    }
  });
};

const stopRenderLoop = () => {
  looping = false;
};

const loop = cb => {
  nowMs = +new Date();
  nowDt = 0;
  loopCb = cb;
  looping = true;

  const _loop = () => {
    const now = +new Date();
    nowDt = now - nowMs;
    nowMs = now;
    if (loopCb) {
      loopCb();
    }
    if (looping) {
      requestAnimationFrame(_loop);
    }
  };
  requestAnimationFrame(_loop);
};
