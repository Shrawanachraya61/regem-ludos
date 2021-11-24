import { loadRPGScript } from 'lib/rpgscript';
import { Scene } from 'model/scene';

export const init = async (scene: Scene) => {
  await Promise.all([
    loadRPGScript('test2', scene),
    loadRPGScript('test', scene),
    loadRPGScript('example', scene),
    loadRPGScript('utils', scene),
    loadRPGScript('floor1/tic-tac-toe', scene),
    loadRPGScript('floor1/ping-pong', scene),
    loadRPGScript('floor1/floor1-atrium', scene),
    loadRPGScript('floor1/floor1-tut', scene),
    loadRPGScript('floor1/floor1', scene),
    loadRPGScript('floor2/floor2-throne-room', scene),
    loadRPGScript('floor2/jesse-cafeteria', scene),
    loadRPGScript('intro', scene),
    loadRPGScript('bowling', scene),
  ]);
};
