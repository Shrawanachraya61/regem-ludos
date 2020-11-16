import { loadTiles } from 'model/sprite';
import { loadRooms } from 'model/room';
import { setCurrentPlayer, setCurrentRoom } from 'model/scene';
import { runMainLoop } from 'controller/loop';
import { playerCreate } from 'model/player';
import { battleStatsCreate, BattlePosition } from 'model/battle';
import { AnimationState, Facing } from 'model/character';
import { loadRes } from 'controller/res-loader';
import { getCanvas, setDrawScale } from 'model/canvas';
import { initiateBattle } from 'controller/battle-management';
import { initEvents } from 'controller/events';
import { mountUi } from 'view/ui';
import { BATTLE_AI_ATTACK } from 'controller/battle-ai';

export const main = async (): Promise<void> => {
  await loadTiles();
  await loadRooms();
  await loadRes();
  getCanvas(); // loads the canvas before the events so getBoundingClientRect works correctly
  setDrawScale(1);
  initEvents();

  const player = playerCreate({
    name: 'Ada',
    spriteBase: 'ada',
    stats: battleStatsCreate(),
    facing: Facing.RIGHT,
    animationState: AnimationState.BATTLE_IDLE,
  });
  setCurrentPlayer(player);
  initiateBattle(player, {
    roomName: 'battle1',
    enemies: [
      {
        chTemplate: {
          name: 'guy',
          spriteBase: 'guy',
          stats: battleStatsCreate(),
          facing: Facing.LEFT,
          animationState: AnimationState.BATTLE_IDLE,
        },
        position: BattlePosition.FRONT,
        ai: BATTLE_AI_ATTACK,
      },
    ],
  });

  mountUi();
  runMainLoop();
};
