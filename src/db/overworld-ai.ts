import {
  AnimationState,
  Facing,
  Character,
  characterAddTimer,
  characterSetWalkTarget,
} from 'model/character';
import { Overworld } from 'model/overworld';
import { Timer } from 'model/utility';
import commands from 'controller/scene-commands';
import { Point } from 'utils';
import { getCurrentRoom } from 'model/generics';

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

export const init = () => {
  exp.DO_NOTHING = {
    update: function () {},
  };

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
