import { createAnimation, Animation } from 'model/animation';
import { BattleStats, battleStatsCreate } from 'model/battle';
import { Transform } from 'model/utility';
import {
  Point,
  Point3d,
  Circle,
  isoToPixelCoords,
  getAngleTowards,
  getNormalizedVec,
  circleCircleCollision,
  getAngleFromVector,
  calculateDistance,
} from 'utils';
import { BattleActions, BattleAction } from 'controller/battle-actions';
import { getCurrentRoom, getFrameMultiplier } from 'model/generics';
import { roomGetTileBelow, roomGetTileAt, Tile } from 'model/room';

export const DEFAULT_SPEED = 1;

export enum Facing {
  LEFT = 'left',
  UP = 'up',
  DOWN = 'down',
  LEFT_UP = 'leftup',
  LEFT_DOWN = 'leftdown',
  RIGHT = 'left_f',
  RIGHT_UP = 'leftup_f',
  RIGHT_DOWN = 'leftdown_f',
  RIGHT2 = 'right',
  RIGHT_UP2 = 'rightup',
  RIGHT_DOWN2 = 'rightdown',
}

export enum AnimationState {
  IDLE = 'idle',
  WALK = 'walk',
  BATTLE_IDLE = 'battle_idle',
  BATTLE_JUMP = 'battle_jump',
  BATTLE_ATTACK = 'battle_attack',
  BATTLE_DAMAGED = 'battle_damaged',
  BATTLE_STAGGERED = 'battle_staggered',
  BATTLE_ITEM = 'battle_item',
  BATTLE_FLOURISH = 'battle_flourish',
  BATTLE_DEFEATED = 'battle_defeated',
}

export const ANIMATIONS_WITHOUT_FACING = [AnimationState.BATTLE_FLOURISH];

export interface Character {
  name: string;
  spriteBase: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  speed: number;
  hp: number;
  transform: Transform | null;
  stats: BattleStats;
  skills: BattleAction[];
  skillIndex: number;
  facing: Facing;
  animationState: AnimationState;
  animationKey: string;
  animationPromise?: {
    resolve: () => void;
    reject: () => void;
  };
  storedAnimations: { [key: string]: Animation };
  walkTarget: null | Point;
  onReachWalkTarget: null | (() => void);
}

export interface CharacterTemplate {
  name: string;
  spriteBase: string;
  talkTrigger?: string;
  stats?: BattleStats;
  facing?: Facing;
  animationState?: AnimationState;
  skills?: BattleAction[];
}

export const characterCreate = (name: string): Character => {
  const ch = {
    name,
    spriteBase: 'ada',
    x: 0,
    y: 0,
    z: 0,
    vx: 0,
    vy: 0,
    speed: DEFAULT_SPEED,
    transform: null,
    hp: 10,
    stats: battleStatsCreate(),
    skills: [BattleActions.SWING] as BattleAction[],
    skillIndex: 0,
    facing: Facing.LEFT,
    animationState: AnimationState.IDLE,
    animationKey: '',
    storedAnimations: {},
    walkTarget: null,
    onReachWalkTarget: null,
  };
  ch.animationKey = characterGetAnimKey(ch);
  return ch;
};

export const characterCreateFromTemplate = (
  template: CharacterTemplate
): Character => {
  const ch = characterCreate(template.name);
  ch.spriteBase = template.spriteBase;
  ch.facing = template.facing || ch.facing;
  ch.animationState = template.animationState || ch.animationState;
  ch.animationKey = characterGetAnimKey(ch);
  ch.hp = ch.stats.HP;
  ch.stats = {
    ...(template.stats || ch.stats),
  };
  ch.skills = template.skills || ch.skills;
  return ch;
};

export const characterGetAnimKey = (ch: Character): string => {
  const { spriteBase, facing, animationState } = ch;
  if (ANIMATIONS_WITHOUT_FACING.includes(animationState)) {
    const animStr = `${spriteBase}_${animationState}`;
    return animStr;
  } else {
    const animStr = `${spriteBase}_${animationState}_${facing}`;
    return animStr;
  }
};

export const characterGetAnimation = (ch: Character): Animation => {
  const { storedAnimations } = ch;
  const animStr = characterGetAnimKey(ch);
  const anim = storedAnimations[animStr];
  if (anim) {
    return anim;
  } else {
    const anim = createAnimation(animStr);
    storedAnimations[animStr] = anim;
    return anim;
  }
};

export const characterSetAnimationState = (
  ch: Character,
  animState: AnimationState
): void => {
  ch.animationState = animState;
  const newAnimKey = characterGetAnimKey(ch);
  if (newAnimKey !== ch.animationKey) {
    if (ch.animationPromise) {
      ch.animationPromise.reject();
      ch.animationPromise = undefined;
    }
    ch.animationKey = newAnimKey;
    const anim = characterGetAnimation(ch);
    anim.reset();
    anim.start();
  }
};

export const characterSetPos = (ch: Character, pt: Point3d): void => {
  ch.x = pt[0];
  ch.y = pt[1];
  ch.z = pt[2];
};

// waits for animation to complete, then calls the callback.  If an animation is changed while
// waiting for the animation to complete, then the callback is never run.
export const characterOnAnimationCompletion = (
  ch: Character,
  cb: () => void
): Promise<void> => {
  if (ch.animationPromise) {
    ch.animationPromise.reject();
  }
  const anim = characterGetAnimation(ch);
  const newPromiseObj: any = {};
  const promise = new Promise<void>((resolve, reject) => {
    newPromiseObj.resolve = resolve;
    newPromiseObj.reject = reject;
    const doThing = async () => {
      await anim.onCompletion();
      ch.animationPromise = undefined;
      resolve();
    };
    doThing();
  })
    .then(() => {
      cb();
    })
    .catch(e => {
      console.log('animation was canceled:', anim.name, e);
    });

  ch.animationPromise = newPromiseObj;
  return promise;
};

export const characterSetFacing = (ch: Character, facing: Facing): void => {
  ch.facing = facing;
  characterSetAnimationState(ch, ch.animationState);
};

export const characterSetFacingFromAngle = (ch: Character, angle: number) => {
  if (angle > 360 - 22.5 || angle < 22.5) {
    characterSetFacing(ch, Facing.UP);
    return;
  }

  const facings = [
    Facing.UP,
    Facing.RIGHT_UP,
    Facing.RIGHT,
    Facing.RIGHT_DOWN,
    Facing.DOWN,
    Facing.LEFT_DOWN,
    Facing.LEFT,
    Facing.LEFT_UP,
  ];

  for (let i = 1; i < 8; i++) {
    if (angle >= i * 45 - 22.5 && angle < (i + 1) * 45 - 22.5) {
      characterSetFacing(ch, facings[i]);
    }
  }
};

export const characterModifyHp = (ch: Character, n: number): void => {
  ch.hp += n;
  if (ch.hp > ch.stats.HP) {
    ch.hp = ch.stats.HP;
  } else if (ch.hp < 0) {
    ch.hp = 0;
  }
};

export const characterGetHpPct = (ch: Character): number => {
  return Number((ch.hp / ch.stats.HP).toFixed(2));
};

export const characterSetTransform = (
  ch: Character,
  transform: Transform
): void => {
  ch.transform = transform;
};

export const characterGetPos = (ch: Character): Point3d => {
  if (ch.transform) {
    return ch.transform.current();
  }
  return [ch.x, ch.y, ch.z];
};

export const characterGetPosBottom = (ch: Character): Point => {
  const { x, y } = ch;
  return [x + 16, y + 16];
};

export const characterGetPosPx = (ch: Character): Point => {
  const [x, y, z] = characterGetPos(ch);
  return isoToPixelCoords(x, y, z);
};

export const characterGetPosCenterPx = (ch: Character): Point => {
  const [px, py] = characterGetPosPx(ch);
  const [w, h] = characterGetSize(ch);
  return [px + w / 2, py + h / 2];
};

export const characterGetSize = (ch: Character): Point => {
  const anim = characterGetAnimation(ch);
  return anim.getSpriteSize(0);
};

export const characterSetWalkTarget = (
  ch: Character,
  point: Point,
  cb: () => void
) => {
  ch.walkTarget = point;
  ch.onReachWalkTarget = cb;
};

export const characterSetSpeed = (ch: Character, speed: number) => {
  ch.speed = speed;
};

export const characterResetSpeed = (ch: Character) => {
  ch.speed = DEFAULT_SPEED;
};

export const characterCollidesWithPoint = (
  ch: Character,
  target: Point,
  r: number
): boolean => {
  const myself = [...characterGetPosBottom(ch), 2] as Circle;
  const other = [target[0], target[1], r] as Circle;
  return circleCircleCollision(myself, other);
};

export const characterUpdate = (ch: Character): void => {
  const room = getCurrentRoom();

  if (ch.transform) {
    ch.transform.update();
    if (ch.transform.shouldRemove) {
      ch.transform = null;
    }
  }

  const frameMult = getFrameMultiplier();

  if (ch.walkTarget) {
    const point1 = characterGetPosBottom(ch);
    const point2 = ch.walkTarget;
    const angle = getAngleTowards(point1, point2);
    const vx = Math.sin(angle);
    const vy = -Math.cos(angle);
    ch.vx = vx;
    ch.vy = vy;
    characterSetAnimationState(ch, AnimationState.WALK);
    if (characterCollidesWithPoint(ch, ch.walkTarget, 6)) {
      characterSetAnimationState(ch, AnimationState.IDLE);
      if (ch.onReachWalkTarget) {
        ch.onReachWalkTarget();
      }
      ch.walkTarget = null;
      ch.onReachWalkTarget = null;
    }
  }

  if (ch.vx !== 0 || ch.vy !== 0) {
    const [newVx, newVy] = getNormalizedVec(ch.vx, ch.vy);
    const finalVx = newVx * frameMult * ch.speed;
    const finalVy = newVy * frameMult * ch.speed;
    ch.x += finalVx;
    ch.y += finalVy;

    const angle = getAngleFromVector(-finalVx, -finalVy) - 45;
    characterSetFacingFromAngle(ch, angle);

    const tile = roomGetTileBelow(room, ch);
    let tileBelowY1: Tile | null = null;
    let tileBelowX1: Tile | null = null;
    if (tile) {
      // tile.highlighted = true;
      tileBelowY1 = roomGetTileAt(room, tile.x, tile.y + 1);
      tileBelowX1 = roomGetTileAt(room, tile.x + 1, tile.y);
    }
    if (tile?.isWall || tileBelowY1?.isWall || tileBelowX1?.isWall) {
      // if (tile && tileBelowY1) {
      //   tile.highlighted = true;
      //   tileBelowY1.highlighted = true;
      // }
      ch.x -= finalVx;
      ch.y -= finalVy;
    }

    ch.vx = 0;
    ch.vy = 0;
  }
};
