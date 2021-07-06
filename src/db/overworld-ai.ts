import {
  AnimationState,
  Facing,
  Character,
  characterAddTimer,
  characterSetWalkTarget,
  characterGetPos,
  characterHasWalkTarget,
  characterGetPosBottom,
  characterCanSeeOther,
  characterClearTimers,
  characterStopWalking,
  characterSetOverworldAi,
  characterCollidesWithOther,
  characterSetPos,
  characterSetFacing,
  characterGetCollisionCircle,
} from 'model/character';
import { Overworld, overworldHide, overworldShow } from 'model/overworld';
import { Timer } from 'model/utility';
import commands, {
  despawnCharacter,
  fadeIn,
  fadeOut,
  spawnParticleAtCharacter,
} from 'controller/scene-commands';
import {
  Point,
  facingToIncrements,
  truncatePoint3d,
  timeoutPromise,
  pxFacingToWorldFacing,
  calculateDistance,
} from 'utils';
import {
  getCurrentOverworld,
  getCurrentPlayer,
  getCurrentRoom,
  getCurrentScene,
  setCurrentBattle,
  setCurrentRoom,
} from 'model/generics';
import {
  Room,
  roomGetTileBelow,
  roomGetTileAt,
  roomRemoveCharacter,
  roomAddParticle,
} from 'model/room';
import { createPFPath, pfPathToRoomPath } from 'controller/pathfinding';
import {
  getReturnToOverworldBattleCompletionCB,
  transitionToBattle,
} from 'controller/battle-management';
import { showSection } from 'controller/ui-actions';
import { AppSection } from 'model/store';
import { createParticleAtCharacter } from 'controller/battle-actions';
import { EFFECT_TEMPLATE_AGGROED } from 'model/particle';
import { playSoundName } from 'model/sound';
import { callScript, createAndCallScript } from 'controller/scene-management';
import { sceneIsWaiting } from 'model/scene';

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
// that is just before hitting the wall, when seeking down or right, skip at the tile one
// before the wall (cuz my rendering system kinda sucks)
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
  const [incrementX, incrementY] = facingToIncrements(
    pxFacingToWorldFacing(direction)
  );

  let loopCtr = 0;
  let xOffset = startingPoint[0];
  let yOffset = startingPoint[1];
  let useDecrement = true;
  do {
    if (tile) {
      const nextTile = roomGetTileAt(
        room,
        tile.x + incrementX,
        tile.y + incrementY
      );
      if (nextTile && !nextTile.isWall) {
        if (incrementX > 0) {
          const nextTileRight = roomGetTileAt(room, nextTile.x + 1, nextTile.y);
          if (nextTileRight?.isWall) {
            useDecrement = false;
            break;
          }
        }
        if (incrementY > 0) {
          const nextTileDown = roomGetTileAt(room, nextTile.x, nextTile.y + 1);
          if (nextTileDown?.isWall) {
            useDecrement = false;
            break;
          }
        }

        tile = nextTile;
        xOffset += 16 * incrementX;
        yOffset += 16 * incrementY;
      } else {
        break;
      }
    }
    loopCtr++;
  } while (loopCtr < 100);

  if (useDecrement) {
    // move back half a tile to adjust for potentially embedding the ch into the tile
    xOffset -= 8 * incrementX;
    yOffset -= 8 * incrementY;
  }

  // HACK push stuff further towards bottom walls because the walking system is funky.
  // it's tile size (16) - weird z index offset (3 ish)
  // direction is in SCREEN direction, left on the screen is down left for WORLD direction
  if (direction === Facing.LEFT_DOWN) {
    yOffset += 13;
  } else if (direction === Facing.RIGHT_DOWN) {
    xOffset += 13;
  }

  return [xOffset, yOffset];
};

const startEncounterFromRoamer = (ch: Character) => {
  const encounter = ch.encounter;
  const oldRoom = getCurrentRoom();
  if (encounter) {
    playSoundName('battle_encountered');
    overworldHide(getCurrentOverworld());
    const player = getCurrentPlayer();
    const leaderPos = characterGetPos(player.leader);
    const leaderFacing = player.leader.facing;
    transitionToBattle(
      player,
      encounter,
      getReturnToOverworldBattleCompletionCB(
        oldRoom,
        leaderPos,
        leaderFacing,
        encounter,
        ch
      ),
      false
    );
  } else {
    console.error('ERROR: Roamer has no Encounter!', ch);
  }
};

export const init = () => {
  exp.DO_NOTHING = {
    update: function () {},
  };

  exp.ROAM_SEEK_PLAYER = (function () {
    const chWalkAtPlayer = (ch: Character) => {
      const room = getCurrentRoom();
      const startPoint = characterGetPos(ch);
      const targetPoint = characterGetPos(getCurrentPlayer().leader);
      const tileStart = roomGetTileBelow(room, truncatePoint3d(startPoint));
      const tileTarget = roomGetTileBelow(room, truncatePoint3d(targetPoint));

      const pfPath = createPFPath(
        [tileStart?.x || 0, tileStart?.y || 0],
        [tileTarget?.x || 0, tileTarget?.y || 0],
        getCurrentRoom()
      );
      const roomPath = pfPathToRoomPath(pfPath);
      const firstPointInPath = roomPath[1] ?? roomPath[0];

      // walk towards the first position in the path
      if (firstPointInPath) {
        // HACK negative offsets prevent the character from z-fighting walls
        // on the back side.  Otherwise they walk too close to the wall and clip
        // into it.  These numbers also affect the offset fix hack in the character
        // update function.  As these become more negative, the character is liable
        // to get stuck on the bottom part of walls and needs a fix to push them down.
        characterSetWalkTarget(
          ch,
          [firstPointInPath[0] - 7, firstPointInPath[1] - 7],
          () => {}
        );
      } else {
        const despawnFunc = async () => {
          if (ch.encounterStuckRetries > 3) {
            const leader = getCurrentPlayer().leader;
            console.log(
              'DESPAWN ENCOUNTER',
              roomGetTileBelow(room, [ch.x, ch.y]),
              roomGetTileBelow(room, [leader.x, leader.y]),
              pfPath
            );
            playSoundName('spawn_enemy');
            spawnParticleAtCharacter(
              'EFFECT_TEMPLATE_SPAWN',
              ch.name,
              'normal'
            );
            await timeoutPromise(400);
            despawnCharacter(ch.name);
          } else {
            t.awaits.push(() => {
              ch.aiState.halted = false;
            });
            characterAddTimer(ch, t);
          }
        };

        const scene = getCurrentScene();
        if (sceneIsWaiting(scene) || scene.currentScript) {
          return;
        }

        ch.aiState.halted = true;
        const t = new Timer(300);
        ch.encounterStuckRetries++;
        despawnFunc();
      }
    };

    return {
      onCreate: (ch: Character) => {
        ch.aiState.halted = true;
        const t = new Timer(500);
        t.awaits.push(() => {
          ch.aiState.halted = false;
        });
        characterAddTimer(ch, t);
      },
      update: (ch: Character) => {
        if (!ch.aiState.halted && !ch.walkTarget) {
          chWalkAtPlayer(ch);
        }
        const scene = getCurrentScene();
        if (sceneIsWaiting(scene) || scene.currentScript) {
          return;
        }
        if (
          !ch.aiState.encountered &&
          characterCollidesWithOther(ch, getCurrentPlayer().leader)
        ) {
          ch.aiState.halted = true;
          ch.aiState.encountered = true;
          roomRemoveCharacter(getCurrentRoom(), ch);
          startEncounterFromRoamer(ch);
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

      const facing = nextMarker === 0 ? direction1 : direction2;
      const target = findNextLinearWalkPosition(room, [chX, chY], facing);
      characterSetWalkTarget(ch, target, cb);
    };

    return {
      onCreate: (ch: Character) => {
        ch.aiState.isWaiting = true;
        ch.aiState.nextMarker = 1;
        const t = new Timer(1000);
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
          const t = new Timer(1000);
          t.awaits.push(() => {
            chWalkToNextPosition(ch, () => {
              ch.aiState.isWaiting = false;
            });
          });
          characterAddTimer(ch, t);
        }
        const player = getCurrentPlayer();
        const leader = player.leader;
        if (characterCanSeeOther(ch, leader)) {
          playSoundName('aggro_alert');
          const particle = createParticleAtCharacter(
            {
              ...EFFECT_TEMPLATE_AGGROED,
            },
            ch
          );
          ch.speed = 1.6;
          roomAddParticle(getCurrentRoom(), particle);
          characterClearTimers(ch);
          characterStopWalking(ch);
          characterSetOverworldAi(ch, exp.ROAM_SEEK_PLAYER);
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
