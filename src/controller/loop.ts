import {
  getCurrentRoom,
  setFrameMultiplier,
  setNow,
  setDeltaT,
  getMousePos,
  getIsPaused,
  setIsPaused,
  getRenderables,
} from 'model/generics';
import { createAnimation } from 'model/animation';
import { TILE_WIDTH, TILE_HEIGHT, roomGetTileAt } from 'model/room';
import { pixelToIsoCoords } from 'utils';
import { clearScreen, drawAnimation, drawRoom } from 'view/draw';
import { Character, characterUpdate } from 'model/character';
import { particleUpdate } from 'model/particle';
import { BattleCharacter, getCurrentBattle } from 'model/battle';
import { renderUi } from 'view/ui';
import { updateBattle } from 'controller/battle-management';

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

  let lastHighlightedTile: any = null;

  const loop = (now: number) => {
    const dt = now - prevNow;
    const fm = dt / sixtyFpsMs;
    setFrameMultiplier(fm > 2 ? 2 : fm);
    setNow(now);
    setDeltaT(dt);
    prevNow = now;
    setNow(now);

    if (getIsPaused()) {
      if ((window as any).running) requestAnimationFrame(loop);
      return;
    }

    clearScreen();

    const roomXOffset = 512 / 2 - 32 / 2;
    const roomYOffset = 50;

    const room = getCurrentRoom();
    if (room) {
      for (let i = 0; i < room.characters.length; i++) {
        characterUpdate(room.characters[i]);
      }
      for (let i = 0; i < room.particles.length; i++) {
        particleUpdate(room.particles[i]);
        if (room.particles[i].shouldRemove) {
          room.particles.splice(i, 1);
          i--;
        }
      }
    }
    const battle = getCurrentBattle();
    if (battle) {
      updateBattle(battle);
    }
    if (room) {
      drawRoom(room, [roomXOffset, roomYOffset]);
    }

    const renderables = getRenderables();
    for (let i in renderables) {
      const cb = renderables[i];
      cb();
    }

    if (room) {
      const [mouseX, mouseY] = getMousePos();
      const [worldX, worldY] = pixelToIsoCoords(
        mouseX - roomXOffset - TILE_WIDTH / 2,
        mouseY - roomYOffset - TILE_HEIGHT / 2
      );
      const tileX = Math.floor((worldX / TILE_WIDTH) * 2);
      const tileY = Math.floor((worldY / TILE_HEIGHT) * 2);
      const tile = roomGetTileAt(room, tileX, tileY);
      if (lastHighlightedTile !== tile && lastHighlightedTile) {
        lastHighlightedTile.highlighted = false;
      }
      if (tile) {
        tile.highlighted = true;
      }
      lastHighlightedTile = tile;
    }

    if ((window as any).running) requestAnimationFrame(loop);
    // if ((window as any).running) setTimeout(() => loop(performance.now()), 100); // for debugging
  };
  loop(startTime);
};
