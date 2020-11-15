import { setFrameMultiplier, setNow, setDeltaT, getMousePos } from 'model/misc';
import { createAnimation } from 'model/animation';
import { getCurrentRoom } from 'model/scene';
import { TILE_WIDTH, TILE_HEIGHT, roomGetTileAt } from 'model/room';
import { pixelToIsoCoords } from 'utils';
import { clearScreen, drawAnimation, drawRoom } from 'view/draw';
import { characterUpdate } from 'model/character';
import { particleUpdate } from 'model/particle';
import { battleUpdate, getCurrentBattle } from 'model/battle';

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
    clearScreen();

    const roomXOffset = 512 / 2 - 32 / 2;
    const roomYOffset = 100;

    const room = getCurrentRoom();
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
    const battle = getCurrentBattle();
    if (battle) {
      battleUpdate(battle);
    }
    drawRoom(room, [roomXOffset, roomYOffset]);

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

    if ((window as any).running) requestAnimationFrame(loop);
    // if ((window as any).running) setTimeout(() => loop(performance.now()), 100); // for debugging
  };
  loop(startTime);
};
