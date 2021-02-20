import {
  getCurrentRoom,
  getCurrentBattle,
  setFrameMultiplier,
  setNow,
  setDeltaT,
  getMousePos,
  getIsPaused,
  setIsPaused,
  getRenderables,
  getCurrentPlayer,
  getCurrentOverworld,
  getCurrentScene,
  getRenderBackgroundColor,
} from 'model/generics';
import { createAnimation } from 'model/animation';
import {
  TILE_WIDTH,
  TILE_HEIGHT,
  roomGetTileAt,
  roomGetTileBelow,
} from 'model/room';
import { pixelToIsoCoords, isoToPixelCoords } from 'utils';
import {
  clearScreen,
  drawAnimation,
  drawRoom,
  drawRect,
  drawSprite,
} from 'view/draw';
import { Character, characterUpdate } from 'model/character';
import { particleUpdate } from 'model/particle';
import { BattleCharacter } from 'model/battle';
import { renderUi } from 'view/ui';
import { updateBattle } from 'controller/battle-management';
import { updateOverworld } from 'controller/overworld-management';
import { getDrawScale, getCtx, getScreenSize } from 'model/canvas';
import { updateScene } from './scene-management';
import { playerGetCameraOffset } from 'model/player';

export const pause = () => {
  if (getIsPaused()) {
    return;
  }
  setIsPaused(true);
  renderUi();

  const room = getCurrentRoom();
  if (room) {
    room.characters.forEach((ch: Character) => {
      if (ch.transform) {
        ch.transform.timer.pause();
      }
    });
  }

  const battle = getCurrentBattle();
  if (battle) {
    battle.allies.concat(battle.enemies).forEach((bCh: BattleCharacter) => {
      bCh.actionTimer.pause();
      bCh.staggerTimer.pause();
      bCh.castTimer.pause();
    });
  }
};

export const unpause = () => {
  if (!getIsPaused()) {
    return;
  }
  setIsPaused(false);
  renderUi();

  const room = getCurrentRoom();
  if (room) {
    room.characters.forEach((ch: Character) => {
      if (ch.transform) {
        ch.transform.timer.unpause();
      }
    });
  }

  const battle = getCurrentBattle();
  if (battle) {
    battle.allies.concat(battle.enemies).forEach((bCh: BattleCharacter) => {
      bCh.actionTimer.unpause();
      bCh.staggerTimer.unpause();
      bCh.castTimer.unpause();
    });
  }
};

export const runMainLoop = async (): Promise<void> => {
  const startTime = performance.now();
  let prevNow = startTime;
  const sixtyFpsMs = 13;
  (window as any).running = true;

  const loop = (now: number) => {
    const dt = now - prevNow;
    const fm = dt / sixtyFpsMs;
    setFrameMultiplier(fm > 2 ? 2 : fm);
    setDeltaT(dt);
    prevNow = now;
    setNow(now);

    if (getIsPaused()) {
      if ((window as any).running) requestAnimationFrame(loop);
      return;
    }

    // clearScreen();
    // clearScreen(getCtx('outer'));
    // drawRect(
    //   0,
    //   0,
    //   getScreenSize(),
    //   getScreenSize(),
    //   getRenderBackgroundColor()
    // );
    const scene = getCurrentScene();
    const battle = getCurrentBattle();
    const overworld = getCurrentOverworld();
    const room = getCurrentRoom();

    if (scene) {
      updateScene(scene);
    }

    if (room) {
      for (let i = 0; i < room.tiles.length; i++) {
        room.tiles[i].highlighted = false;
      }

      if (overworld) {
        updateOverworld(overworld);
      }

      if (battle) {
        updateBattle(battle);
      }

      for (let i = 0; i < room.characters.length; i++) {
        const ch = room.characters[i];
        characterUpdate(ch);
        // const tile = roomGetTileBelow(room, ch);
        // if (tile) {
        //   tile.highlighted = true;
        // }
      }
      for (let i = 0; i < room.particles.length; i++) {
        particleUpdate(room.particles[i]);
        if (room.particles[i].shouldRemove) {
          room.particles.splice(i, 1);
          i--;
        }
      }

      // position the camera in the right spot
      let roomXOffset = 0;
      let roomYOffset = 0;
      if (battle) {
        roomXOffset = 512 / 2 - 32 / 2;
        roomYOffset = 50;
      } else {
        const player = getCurrentPlayer();
        if (player) {
          const [oX, oY] = playerGetCameraOffset(player);
          roomXOffset = oX;
          roomYOffset = oY;
        }
      }

      // const [mouseX, mouseY] = getMousePos();
      // const [worldX, worldY] = pixelToIsoCoords(
      //   mouseX / getDrawScale() - roomXOffset - TILE_WIDTH / 2,
      //   mouseY / getDrawScale() - roomYOffset - TILE_HEIGHT / 2
      // );
      // const tileX = Math.floor((worldX / TILE_WIDTH) * 2);
      // const tileY = Math.floor((worldY / TILE_HEIGHT) * 2);
      // const tile = roomGetTileAt(room, tileX, tileY);
      // if (lastHighlightedTile !== tile && lastHighlightedTile) {
      //   lastHighlightedTile.highlighted = false;
      // }
      // if (tile) {
      //   tile.highlighted = true;
      // }

      // console.log('OFFSET', roomXOffset, roomYOffset);
      drawRoom(room, [roomXOffset, roomYOffset]);

      // drawSprite('ada_0', 100, 100, 1);
    }

    const renderables = getRenderables();
    for (let i in renderables) {
      const cb = renderables[i];
      cb();
    }

    if ((window as any).running) requestAnimationFrame(loop);
    // if ((window as any).running) setTimeout(() => loop(performance.now()), 33); // for debugging
  };
  loop(startTime);
};
