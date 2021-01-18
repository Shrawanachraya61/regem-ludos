import { getRoom, roomAddParticle, roomGetTileBelow } from 'model/room';
import {
  setCurrentRoom,
  setCurrentOverworld,
  setCurrentPlayer,
  getCurrentPlayer,
  isKeyDown,
  getFrameMultiplier,
  getKeyUpdateEnabled,
} from 'model/generics';
import { Player } from 'model/player';
import {
  Overworld,
  OverworldCharacter,
  OverworldTemplate,
} from 'model/overworld';
import { pixelToIsoCoords, Point3d } from 'utils';
import {
  characterSetAnimationState,
  characterSetFacing,
  characterSetPos,
  Facing,
  AnimationState,
} from 'model/character';

export const initiateOverworld = (
  player: Player,
  template: OverworldTemplate,
  playerPos?: Point3d
): Overworld => {
  const room = getRoom(template.roomName);
  const leader = player.leader;
  const oChLeader: OverworldCharacter = {
    ch: leader,
  };

  if (playerPos) {
    characterSetPos(leader, playerPos);
  } else {
    characterSetPos(leader, [0, 0, 0]);
  }

  room.characters.push(leader);

  const overworld = {
    room,
    people: [oChLeader],
  };

  setCurrentRoom(room);
  setCurrentPlayer(player);
  setCurrentOverworld(overworld);
  return overworld;
};

const getFacingFromKeyState = (): Facing => {
  if (isKeyDown('ArrowLeft') && isKeyDown('ArrowUp')) {
    return Facing.LEFT_UP;
  } else if (isKeyDown('ArrowLeft') && isKeyDown('ArrowDown')) {
    return Facing.LEFT_DOWN;
  } else if (isKeyDown('ArrowRight') && isKeyDown('ArrowUp')) {
    return Facing.RIGHT_UP;
  } else if (isKeyDown('ArrowRight') && isKeyDown('ArrowDown')) {
    return Facing.RIGHT_DOWN;
  } else if (isKeyDown('ArrowLeft')) {
    return Facing.LEFT;
  } else if (isKeyDown('ArrowRight')) {
    return Facing.RIGHT;
  } else if (isKeyDown('ArrowUp')) {
    return Facing.UP;
  } else if (isKeyDown('ArrowDown')) {
    return Facing.DOWN;
  } else {
    return Facing.DOWN;
  }
};

const getNormalizedVec = (x: number, y: number): [number, number] => {
  const d = Math.sqrt(x * x + y * y);
  return [x / d, y / d];
};

export const updateOverworld = (overworld: Overworld): void => {
  const player = getCurrentPlayer();
  const room = overworld.room;
  const leader = player.leader;
  const playerSpeed = 1.5;
  const frameMult = getFrameMultiplier();

  let isMoving = false;
  let vx = 0;
  let vy = 0;
  if (getKeyUpdateEnabled()) {
    if (isKeyDown('ArrowLeft')) {
      isMoving = true;
      vx -= 1;
      vy += 1;
    } else if (isKeyDown('ArrowRight')) {
      isMoving = true;
      vx += 1;
      vy -= 1;
    }
    if (isKeyDown('ArrowUp')) {
      isMoving = true;
      vx -= 1;
      vy -= 1;
    } else if (isKeyDown('ArrowDown')) {
      isMoving = true;
      vx += 1;
      vy += 1;
    }

    if (isMoving) {
      const [newVx, newVy] = getNormalizedVec(vx, vy);
      vx = newVx;
      vy = newVy;
      characterSetFacing(leader, getFacingFromKeyState());
      characterSetAnimationState(leader, AnimationState.WALK);
    } else {
      characterSetAnimationState(leader, AnimationState.IDLE);
    }
    vx = vx * frameMult * playerSpeed;
    vy = vy * frameMult * playerSpeed;
    leader.x += vx;
    leader.y += vy;
    const tile = roomGetTileBelow(room, leader);
    // if (tile) {
    //   tile.highlighted = true;
    // }
    if (tile && tile.isWall) {
      leader.x -= vx;
      leader.y -= vy;
    }
  }
};
