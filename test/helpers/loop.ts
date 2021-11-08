import { updateOverworld } from 'controller/overworld-management';
import { updateScene } from 'controller/scene-management';
import { getCurrentOverworld, getCurrentScene } from 'model/generics';

export const beginLoop = () => {
  const loop = () => {
    const scene = getCurrentScene();
    updateScene(scene);

    const overworld = getCurrentOverworld();
    if (overworld) {
      updateOverworld(overworld);
    }
  };

  return setInterval(loop, 33);
};

export const endLoop = (loop: NodeJS.Timeout) => {
  clearInterval(loop);
};
