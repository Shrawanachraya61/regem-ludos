import {
  AnimationState,
  Facing,
  Character,
  characterAddTimer,
  characterSetWalkTarget,
  characterGetPos,
  characterHasWalkTarget,
  characterGetPosBottom,
} from 'model/character';
import { Overworld } from 'model/overworld';
import { Timer } from 'model/utility';
import commands from 'controller/scene-commands';
import { Point } from 'utils';
import { getCurrentPlayer, getCurrentRoom } from 'model/generics';
import { Room, roomGetTileBelow, roomGetTileAt } from 'model/room';

const exp = {} as { [key: string]: OverworldAI };
export const get = (key: string): OverworldAI => {
  const result = exp[key];
  if (!result) {
    throw new Error(`No overworld-ai exists with name: ${key}`);
  }
  return {
    ...result,
  };
};

export const getIfExists = (key: string): OverworldAI | null => {
  const result = exp[key];
  if (!result) {
    return null;
  }
  return {
    ...result,
  };
};

export interface OverworldAI {
  onCreate?: (ch: Character) => void;
  onDelete?: (ch: Character) => void;
  update: (ch: Character) => void;
}

// from some position, seek in the provided direction for a wall and return the position
// that is just before hitting the wall
const findNextLinearWalkPosition = (
  room: Room,
  startingPoint: Point,
  direction: Facing
): Point => {
  let tile = roomGetTileBelow(room, startingPoint);
  if (!tile) {
    console.error(room, startingPoint, direction);
    console.error(
      'cannot findNextLinearWalkPosition, given startingPoint is not contained within the room.'
    );
    return [0, 0];
  }
  let incrementX = 0;
  let incrementY = 0;

  switch (direction) {
    case Facing.LEFT: {
      incrementX = -1;
      break;
    }
    case Facing.RIGHT: {
      incrementX = 1;
      break;
    }
    case Facing.UP: {
      incrementY = -1;
      break;
    }
    case Facing.DOWN: {
      incrementY = 1;
      break;
    }
    case Facing.LEFT_UP: {
      incrementX = -1;
      incrementY = -1;
      break;
    }
    case Facing.RIGHT_UP: {
      incrementX = 1;
      incrementY = -1;
      break;
    }
    case Facing.LEFT_DOWN: {
      incrementX = -1;
      incrementY = 1;
      break;
    }
    case Facing.RIGHT_DOWN: {
      incrementX = 1;
      incrementY = 1;
      break;
    }
  }

  let loopCtr = 0;
  let xOffset = startingPoint[0];
  let yOffset = startingPoint[1];
  do {
    if (tile) {
      const nextTile = roomGetTileAt(
        room,
        tile.x + incrementX,
        tile.y + incrementY
      );
      if (nextTile && !nextTile.isWall) {
        tile = nextTile;
        xOffset += 16 * incrementX;
        yOffset += 16 * incrementY;
      } else {
        break;
      }
    }
    loopCtr++;
  } while (loopCtr < 100);
  // move back half a tile to adjust for potentially embedding the ch into the tile
  xOffset -= 8 * incrementX;
  yOffset -= 8 * incrementY;
  // xOffset = Math.floor(xOffset);
  // yOffset = Math.floor(yOffset);

  return [xOffset, yOffset];
};

export const init = () => {
  exp.DO_NOTHING = {
    update: function () {},
  };

  exp.ROAM_SEEK_PLAYER = (function () {
    return {
      update: (ch: Character) => {
        if (!characterHasWalkTarget(ch)) {
          const target = getCurrentPlayer().leader;
          const [x, y] = characterGetPosBottom(target);
          characterSetWalkTarget(ch, [x, y], () => {
            console.log('START BATTLE!!!!!');
          });
        }
      },
    };
  })();

  const createDirectionalRoamerAi = function (directions: [Facing, Facing]) {
    const [direction1, direction2] = directions;
    const chWalkToNextPosition = (ch: Character, cb: any) => {
      const room = getCurrentRoom();
      const [chX, chY] = characterGetPos(ch);
      const nextMarker = ch.aiState.nextMarker as number;
      ch.aiState.nextMarker = (nextMarker + 1) % 2;

      const target = findNextLinearWalkPosition(
        room,
        [chX, chY],
        nextMarker === 0 ? direction1 : direction2
      );
      console.log('WALK TO NEXT POSITION', target);
      characterSetWalkTarget(ch, target, cb);
    };

    return {
      onCreate: (ch: Character) => {
        ch.aiState.isWaiting = true;
        ch.aiState.nextMarker = 1;
        const t = new Timer(500);
        t.awaits.push(() => {
          chWalkToNextPosition(ch, () => {
            ch.aiState.isWaiting = false;
          });
        });
        characterAddTimer(ch, t);
      },
      update: (ch: Character) => {
        if (!ch.aiState.isWaiting) {
          ch.aiState.isWaiting = true;
          const t = new Timer(600);
          t.awaits.push(() => {
            chWalkToNextPosition(ch, () => {
              ch.aiState.isWaiting = false;
            });
          });
          characterAddTimer(ch, t);
        }
      },
    };
  };

  exp.ROAM_WALK_RIGHT_LEFT = createDirectionalRoamerAi([
    Facing.RIGHT,
    Facing.LEFT,
  ]);
  exp.ROAM_WALK_UP_DOWN = createDirectionalRoamerAi([Facing.UP, Facing.DOWN]);
  exp.ROAM_WALK_RIGHTUP_LEFTDOWN = createDirectionalRoamerAi([
    Facing.RIGHT_UP,
    Facing.LEFT_DOWN,
  ]);
  exp.ROAM_WALK_RIGHTDOWN_LEFTUP = createDirectionalRoamerAi([
    Facing.RIGHT_DOWN,
    Facing.LEFT_UP,
  ]);

  exp.WALK_BETWEEN_MARKERS_ABC = (function () {
    const markers = ['MarkerWalkA', 'MarkerWalkB', 'MarkerWalkC'];

    const chWalkToNextMarker = (ch: Character, cb: any) => {
      const room = getCurrentRoom();
      const nextMarker = ch.aiState.nextMarker as number;
      const markerName = markers[nextMarker];
      ch.aiState.nextMarker = (nextMarker + 1) % markers.length;
      const marker = room.markers[markerName];

      if (!marker) {
        console.error(
          'OAI: Could not find target marker with name: ' + markerName
        );
        return;
      }
      const target = [marker.x, marker.y] as Point;
      characterSetWalkTarget(ch, target, cb);
    };

    return {
      onCreate: (ch: Character) => {
        ch.aiState.isWaiting = true;
        ch.aiState.nextMarker = 0;
        const t = new Timer(500);
        t.awaits.push(() => {
          chWalkToNextMarker(ch, () => {
            ch.aiState.isWaiting = false;
          });
        });
        characterAddTimer(ch, t);
      },
      update: (ch: Character) => {
        if (!ch.aiState.isWaiting) {
          ch.aiState.isWaiting = true;
          const t = new Timer(600);
          t.awaits.push(() => {
            chWalkToNextMarker(ch, () => {
              ch.aiState.isWaiting = false;
            });
          });
          characterAddTimer(ch, t);
        }
      },
    };
  })();
};
