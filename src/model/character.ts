import { createAnimation, Animation } from 'model/animation';
import { BattleStats, battleStatsCreate } from 'model/battle';
import { Transform, Timer } from 'model/utility';
import {
  Point,
  Point3d,
  Circle,
  Rect,
  isoToPixelCoords,
  getAngleTowards,
  getNormalizedVec,
  circleCircleCollision,
  getAngleFromVector,
  calculateDistance,
  circleRectCollision,
  createPolygonFromRect,
  toFixedPrecision,
  extrapolatePoint,
} from 'utils';
import { BattleActions, BattleAction } from 'controller/battle-actions';
import {
  getCurrentPlayer,
  getCurrentRoom,
  getFrameMultiplier,
} from 'model/generics';
import {
  roomGetTileBelow,
  roomGetTileAt,
  Tile,
  TILE_HEIGHT_WORLD,
  TILE_WIDTH_WORLD,
} from 'model/room';
import { RenderObject } from 'model/render-object';
import { getCtx } from './canvas';
import { drawPolygon, drawRect, drawText } from 'view/draw';
import { playerGetCameraOffset } from 'model/player';
import { OverworldAI, get as getOverworldAi } from 'db/overworld-ai';

export const DEFAULT_SPEED = 0.5;

const DEBUG_drawRectPoint = (point: Point, color: string) => {
  const player = getCurrentPlayer();
  if (player) {
    const outerCtx = getCtx('outer');
    const size = 6;
    const [bx, by] = point;
    const polygon = createPolygonFromRect([
      bx - size / 2,
      by - size / 2,
      size,
      size,
    ]);
    const [offsetX, offsetY] = playerGetCameraOffset(player);
    outerCtx.save();
    outerCtx.translate(offsetX, offsetY);
    drawPolygon(polygon, color, 1, outerCtx);
    outerCtx.restore();
  }
};

const DEBUG_drawText = (text: string, x: number, y: number, color: string) => {
  const player = getCurrentPlayer();
  if (player) {
    const outerCtx = getCtx('outer');
    drawText(text, x, y, { color, size: 14 }, outerCtx);
  }
};

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
  walkAngle: number;
  walkDistance: number;
  walkRetries: number;
  onReachWalkTarget: null | (() => void);
  talkTrigger: string;
  tags: string[];
  aiState: Record<string, string | number | boolean>;
  aiEnabled: boolean;
  overworldAi: OverworldAI;
  storedState: Record<string, any>;
  timers: Timer[];
  ro?: RenderObject;
}

export interface CharacterTemplate {
  name: string;
  spriteBase: string;
  talkTrigger?: string;
  stats?: BattleStats;
  facing?: Facing;
  animationState?: AnimationState;
  skills?: BattleAction[];
  tags?: string[];
  overworldAi?: string;
}

export const characterCreate = (name: string): Character => {
  const ch: Character = {
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
    walkAngle: 0,
    walkDistance: 0,
    walkRetries: 0,
    onReachWalkTarget: null,
    talkTrigger: '',
    aiState: {},
    aiEnabled: true,
    overworldAi: getOverworldAi('DO_NOTHING'),
    storedState: {},
    timers: [] as Timer[],
    tags: [] as string[],
  };
  ch.ro = {
    character: ch,
    sortY: 0,
    visible: true,
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
  ch.talkTrigger = template.talkTrigger ?? '';
  ch.tags = template.tags || ([] as string[]);
  if (template.overworldAi) {
    ch.overworldAi = getOverworldAi(template.overworldAi);
  }
  if (ch.overworldAi.onCreate) {
    ch.overworldAi.onCreate(ch);
  }
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
  return [x + 16, y + 16 - 4];
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
  const point1 = characterGetPosBottom(ch);
  const point2 = characterGetWalkTargetPoint(ch);
  const angle = getAngleTowards(point1, point2);
  ch.walkAngle = angle;
  ch.walkDistance = calculateDistance(
    extrapolatePoint(point1),
    extrapolatePoint(point2)
  );
  ch.walkRetries = 0;
};

// This converts the walkTarget so that it's specified relative to characterPosBottom
const characterGetWalkTargetPoint = (ch: Character): Point => {
  if (ch.walkTarget) {
    return [ch.walkTarget[0] + 16, ch.walkTarget[1] + 16 - 4] as Point;
  } else {
    return [0, 0];
  }
};

export const characterSetSpeed = (ch: Character, speed: number) => {
  ch.speed = speed;
};

export const characterResetSpeed = (ch: Character) => {
  ch.speed = DEFAULT_SPEED;
};

export const characterCollidesWithPoint = (
  ch: Character,
  target: Circle
): boolean => {
  const myself = [...characterGetPosBottom(ch), 1] as Circle;
  return circleCircleCollision(myself, target);
};

export const characterCollidesWithRect = (ch: Character, r: Rect) => {
  const myself = [...characterGetPosBottom(ch), 2] as Circle;
  return circleRectCollision(myself, r) !== 'none';
};

export const characterAddTag = (ch: Character, tag: string) => {
  if (!characterHasTag(ch, tag)) {
    ch.tags.push(tag);
  }
};

export const characterRemoveTag = (ch: Character, tag: string) => {
  const i = ch.tags.indexOf(tag);
  if (i > -1) {
    ch.tags.splice(i, 1);
  }
};

export const characterHasTag = (ch: Character, tag: string) => {
  return ch.tags.includes(tag);
};

export const characterAddTimer = (ch: Character, timer: Timer) => {
  if (!characterHasTimer(ch, timer)) {
    ch.timers.push(timer);
  }
};

export const characterRemoveTimer = (ch: Character, timer: Timer) => {
  const i = ch.timers.indexOf(timer);
  if (i > -1) {
    ch.timers.splice(i, 1);
  }
};

export const characterStopAi = (ch: Character) => {
  characterStoreState(ch);
  ch.aiEnabled = false;
  characterSetAnimationState(ch, AnimationState.IDLE);
};

export const characterStartAi = (ch: Character) => {
  ch.aiEnabled = true;
  characterRestoreState(ch);
};

export const characterHasTimer = (ch: Character, timer: Timer) => {
  return ch.timers.includes(timer);
};

export const characterStoreState = (ch: Character) => {
  ch.storedState.facing = ch.facing;
};

export const characterRestoreState = (ch: Character) => {
  if (ch.storedState.facing) {
    characterSetFacing(ch, ch.storedState.facing);
  }
};

export const characterUpdate = (ch: Character): void => {
  const room = getCurrentRoom();
  const frameMult = getFrameMultiplier();

  if (ch.transform) {
    ch.transform.update();
    if (ch.transform.shouldRemove) {
      ch.transform = null;
    }
  }

  // DEBUG_drawRectPoint(characterGetPosBottom(ch), 'purple');
  // if (ch.name === 'Ada') {
  //   DEBUG_drawText(`${ch.x} ${ch.y}`, 50, 150, 'white');
  // }

  if (ch.walkTarget) {
    const point1 = characterGetPosBottom(ch);
    const point2 = characterGetWalkTargetPoint(ch);
    const angle = getAngleTowards(point1, point2);
    ch.walkAngle = angle;
    const vx = Math.sin((ch.walkAngle * Math.PI) / 180);
    const vy = -Math.cos((ch.walkAngle * Math.PI) / 180);

    const prevWalkDistance = ch.walkDistance;
    ch.walkDistance = calculateDistance(
      extrapolatePoint(point1),
      extrapolatePoint(point2)
    );

    // If enough of these happen, the character probably cannot reach the intended
    // destination, so just warp them there as a fallback.
    if (prevWalkDistance <= ch.walkDistance) {
      ch.walkRetries++;
    }

    ch.vx = vx;
    ch.vy = vy;
    characterSetAnimationState(ch, AnimationState.WALK);
    if (
      ch.walkRetries > 10 ||
      characterCollidesWithPoint(ch, [...point2, 1.5])
    ) {
      characterSetAnimationState(ch, AnimationState.IDLE);
      characterSetPos(ch, [...ch.walkTarget, ch.z]);
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
    const { x: prevX, y: prevY } = ch;

    ch.x += finalVx;
    ch.y += finalVy;

    let angle = getAngleFromVector(-finalVx, -finalVy) - 45;
    if (angle < 0) {
      angle += 360;
    }
    characterSetFacingFromAngle(ch, angle);

    const tile = roomGetTileBelow(room, [ch.x, ch.y]);
    let tileBelowY1: Tile | null = null;
    let tileBelowX1: Tile | null = null;
    if (tile) {
      // tile.highlighted = true;
      // if (ch.name === 'Ada') {
      //   console.log(
      //     tile.x,
      //     tile.y,
      //     tile.x,
      //     Math.floor((ch.y + 8) / TILE_HEIGHT_WORLD)
      //   );
      // }

      tileBelowY1 = roomGetTileAt(
        room,
        tile.x,
        Math.floor((ch.y + 22) / TILE_HEIGHT_WORLD)
      );
      tileBelowX1 = roomGetTileAt(
        room,
        Math.floor((ch.x + 22) / TILE_WIDTH_WORLD),
        tile.y
      );
    }
    const isObstructedByWall =
      isPrimaryWall(tileBelowY1) || isPrimaryWall(tileBelowX1);
    if (tile?.isWall || isObstructedByWall) {
      // if (tile && tileBelowY1) {
      //   tile.highlighted = true;
      //   tileBelowY1.highlighted = true;
      // }
      ch.x = prevX;
      ch.y = prevY;
    }
    // ch.x = parseFloat(ch.x.toFixed(2));
    // ch.y = parseFloat(ch.y.toFixed(2));
    ch.vx = 0;
    ch.vy = 0;
  }

  const [x, y, z] = characterGetPos(ch);
  const [, py] = isoToPixelCoords(x, y, z);
  if (ch.ro) {
    ch.ro.sortY = py + 32;
  }
};

const isPrimaryWall = (tile: Tile | null) => {
  return tile?.isWall && !tile?.isProp;
};
