import { setFrameMultiplier, setNow, setDeltaT } from 'model/misc';
import { createAnimation } from 'model/animation';
import { getCurrentRoom } from 'model/scene';
import { clearScreen, drawAnimation, drawRoom } from 'view/draw';

export const runMainLoop = async (): Promise<void> => {
  const startTime = performance.now();
  let prevNow = startTime;
  const sixtyFpsMs = 13;
  (window as any).running = true;

  const animation = createAnimation('ada_walk_left_f');
  animation.start();

  const loop = (now: number) => {
    const dt = now - prevNow;
    const fm = dt / sixtyFpsMs;
    setFrameMultiplier(fm > 2 ? 2 : fm);
    setNow(now);
    setDeltaT(dt);
    prevNow = now;
    setNow(now);
    clearScreen();

    const room = getCurrentRoom();
    drawRoom(room, [512 / 2 - 32 / 2, 100]);
    drawAnimation(animation, 50, 50);

    if ((window as any).running) requestAnimationFrame(loop);
    // if ((window as any).running) setTimeout(() => loop(performance.now()), 100); // for debugging
  };
  loop(startTime);
};
