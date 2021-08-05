import { createAnimation, Animation, hasAnimation } from 'model/animation';
import { BattleStats, battleStatsCreate, BattleTemplate } from 'model/battle';
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
  pixelToIsoCoords,
  facingToIncrements,
  pxFacingToWorldFacing,
  timeoutPromise,
  normalize,
  tileToWorldCoords,
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
  roomGetDistanceToNearestWallInFacingDirection,
  roomRemoveCharacter,
  roomGetEmptyAdjacentTile,
  Room,
} from 'model/room';
import { RenderObject } from 'model/render-object';
import { getCtx } from './canvas';
import { drawPolygon, drawRect, drawText } from 'view/draw';
import { playerGetCameraOffset } from 'model/player';
import { OverworldAI, get as getOverworldAi } from 'db/overworld-ai';
import { getIfExists as getEncounter } from 'db/encounters';
import { Item, get as getItem, ItemType, WeaponType } from 'db/items';
import { getSprite } from './sprite';

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

export enum WeaponEquipState {
  NORMAL = 'normal',
  RANGED = 'ranged',
  MAGIC = 'magic',
}

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
  OVERRIDDEN = 'overridden',
  IDLE = 'idle',
  WALK = 'walk',
  BATTLE_IDLE = 'battle_idle',
  BATTLE_IDLE_RANGED = 'battle_idle_ranged',
  BATTLE_JUMP = 'battle_jump',
  BATTLE_EVADED = 'battle_evaded',
  BATTLE_ATTACK = 'battle_attack',
  BATTLE_ATTACK_PIERCE = 'battle_attack_p',
  BATTLE_ATTACK_KNOCKDOWN = 'battle_attack_k',
  BATTLE_ATTACK_FINISH = 'battle_attack_f',
  BATTLE_DAMAGED = 'battle_damaged',
  BATTLE_STAGGERED = 'battle_staggered',
  BATTLE_RANGED = 'battle_ranged',
  BATTLE_CAST = 'battle_cast',
  BATTLE_SPELL = 'battle_spell',
  BATTLE_CHANNEL = 'battle_channel',
  BATTLE_ITEM = 'battle_item',
  BATTLE_FLOURISH = 'battle_flourish',
  BATTLE_DEFEATED = 'battle_defeated',
  BATTLE_DEAD = 'battle_dead',
  BATTLE_REVIVE = 'battle_revive',
}

export const ANIMATIONS_WITHOUT_FACING = [AnimationState.BATTLE_FLOURISH];

export interface Character {
  name: string;
  nameLabel: string;
  fullName: string;
  spriteBase: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  spriteWidth: number;
  spriteHeight: number;
  speed: number;
  hp: number;
  resv: number;
  transform: Transform | null;
  stats: BattleStats;
  skills: BattleAction[];
  skillIndex: number;
  equipment: {
    weapon?: Item;
    accessory1?: Item;
    accessory2?: Item;
    armor?: Item;
  };
  experience: number;
  experienceCurrency: number;
  facing: Facing;
  animationState: AnimationState;
  animationOverride: Animation | null;
  animationKey: string;
  animationPromise?: {
    resolve: () => void;
    reject: () => void;
  };
  storedAnimations: { [key: string]: Animation };
  weaponEquipState: WeaponEquipState;
  weaponEquipTypes: WeaponType[];
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
  highlighted: boolean;
  visionRange: number;
  collisionSize: Point;
  collisionOffset: Point;
  template: CharacterTemplate | null;
  encounter?: BattleTemplate;
  encounterStuckRetries: number;
  ro?: RenderObject;
}

export interface CharacterTemplate {
  name: string;
  fullName?: string;
  spriteBase: string;
  nameLabel?: string;
  talkTrigger?: string;
  stats?: BattleStats;
  facing?: Facing;
  animationState?: AnimationState;
  overrideAnimationName?: string;
  skills?: BattleAction[];
  tags?: string[];
  overworldAi?: string;
  armor?: number;
  weaponEquipState?: WeaponEquipState;
  spriteSize?: Point;
  canGetStuckWhileWalking?: boolean;
  encounterName?: string;
  speed?: number;
  staggerSoundName?: string;
  weaponEquipTypes?: WeaponType[];
  collisionSize?: number;
  collisionOffset?: Point;
  equipment?: {
    weapon: Item;
    accessory1?: Item;
    accessory2?: Item;
    armor?: Item;
  };
}

export const characterCreate = (name: string): Character => {
  const ch: Character = {
    name,
    nameLabel: name,
    fullName: '',
    spriteBase: 'ada',
    x: 0,
    y: 0,
    z: 0,
    vx: 0,
    vy: 0,
    spriteWidth: 32,
    spriteHeight: 32,
    speed: DEFAULT_SPEED,
    transform: null,
    hp: 10,
    resv: 10,
    experience: 2,
    experienceCurrency: 10,
    stats: battleStatsCreate(),
    skills: [BattleActions.SWING] as BattleAction[],
    skillIndex: 0,
    equipment: {
      weapon: getItem('NoWeapon'),
    },
    facing: Facing.LEFT,
    animationState: AnimationState.IDLE,
    animationKey: '',
    animationOverride: null,
    storedAnimations: {},
    weaponEquipState: WeaponEquipState.NORMAL,
    weaponEquipTypes: [],
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
    highlighted: false,
    visionRange: 24 * 2,
    collisionSize: [16, 16],
    collisionOffset: [0, 0],
    encounterStuckRetries: 0,
    template: null,
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
  ch.hp = template?.stats?.HP ?? ch.stats.HP;
  ch.stats = {
    ...(template.stats || ch.stats),
  };
  ch.resv = ch.stats.RESV;
  ch.skills = template.skills || ch.skills;
  ch.talkTrigger = template.talkTrigger ?? '';
  ch.tags = template.tags || ([] as string[]);
  if (template.overworldAi) {
    ch.overworldAi = getOverworldAi(template.overworldAi);
  }
  if (ch.overworldAi.onCreate) {
    ch.overworldAi.onCreate(ch);
  }
  if (template.nameLabel) {
    ch.nameLabel = template.nameLabel;
  }
  if (template.weaponEquipState) {
    ch.weaponEquipState = template.weaponEquipState;
  }
  if (template.spriteSize) {
    ch.spriteWidth = template.spriteSize[0];
    ch.spriteHeight = template.spriteSize[1];
  }
  if (template.canGetStuckWhileWalking) {
    // if walkRetries cannot be incremented, then the character is able to get stuck
    // on things.  This is the desired behavior for some roaming npcs who cause battles
    // when you bonk into them.
    ch.walkRetries = -Infinity;
  }
  if (template.encounterName) {
    const encounter = getEncounter(template.encounterName);
    if (!encounter) {
      console.error(template);
      throw new Error(
        `Cannot create character from template.  No encounter exists with encounterName="${template.encounterName}"`
      );
    }
    ch.encounter = encounter;
  }
  if (template.speed) {
    ch.speed = template.speed;
  }
  if (template.equipment) {
    Object.assign(ch.equipment, template.equipment);
  }
  if (template.weaponEquipTypes) {
    ch.weaponEquipTypes = [...template.weaponEquipTypes];
  }
  if (template.fullName) {
    ch.fullName = template.fullName;
  }
  if (template.collisionSize !== undefined) {
    ch.collisionSize = [template.collisionSize, template.collisionSize];
  }
  if (template.collisionOffset !== undefined) {
    ch.collisionOffset = template.collisionOffset.slice() as Point;
  }
  if (template.overrideAnimationName) {
    const animName = template.overrideAnimationName;
    if (!hasAnimation(animName)) {
      console.error(
        'loading ch template',
        template.name,
        'Could not find override animation with name: ' + animName
      );
    } else {
      const anim = createAnimation(animName);
      characterOverrideAnimation(ch, anim);
    }
  }
  ch.template = template;
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

  if (ch.animationState === AnimationState.OVERRIDDEN) {
    const anim = ch.animationOverride;
    if (anim) {
      return anim;
    } else {
      throw new Error('Null overridden animation.');
    }
  }

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
  animState: AnimationState,
  reset?: boolean
): void => {
  ch.animationState = animState;
  const newAnimKey = characterGetAnimKey(ch);

  if (newAnimKey !== ch.animationKey) {
    if (ch.animationPromise) {
      ch.animationPromise.reject();
      ch.animationPromise = undefined;
    }

    if (ch.animationState === AnimationState.OVERRIDDEN) {
      return;
    }

    ch.animationKey = newAnimKey;
    const anim = characterGetAnimation(ch);
    anim.reset();
    anim.start();
  } else if (reset) {
    const anim = characterGetAnimation(ch);
    anim.reset();
    anim.start();
  }
};

export const characterGetAnimationState = (ch: Character): AnimationState => {
  return ch.animationState;
};

// Set an animation that isn't derived from the state of the character
export const characterOverrideAnimation = (
  ch: Character,
  animation: Animation,
  cb?: () => void
) => {
  characterSetAnimationState(ch, AnimationState.OVERRIDDEN);
  ch.animationOverride = animation;
  if (cb) {
    if (animation.loop) {
      animation;
    } else {
      animation.awaits.push(cb);
    }
  }
  animation.reset();
  animation.start();
};

export const characterSetPos = (ch: Character, pt: Point3d): void => {
  ch.x = Math.floor(pt[0]);
  ch.y = Math.floor(pt[1]);
  ch.z = Math.floor(pt[2]);
};

// waits for animation to complete, then calls the callback.  If an animation is changed while
// waiting for the animation to complete, then the callback is never run.
export const characterOnAnimationCompletion = (
  ch: Character,
  cb: () => void
): Promise<void> => {
  if (ch.animationPromise) {
    console.log(
      'overriding previous animation completion',
      characterGetAnimation(ch).name
    );
    ch.animationPromise.reject();
  }
  const anim = characterGetAnimation(ch);

  if (anim.loop) {
    console.error(
      'Setting characterOnAnimationCompletion for an animation set with loop=true',
      anim.name
    );
    return Promise.resolve();
  }

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
    if (angle >= i * 45 - 22.5 && angle <= (i + 1) * 45 - 22.5) {
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

export const characterGetResvPct = (ch: Character): number => {
  return Number((ch.resv / ch.stats.RESV).toFixed(2));
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

export const characterGetPosTopLeftPx = (ch: Character): Point => {
  return characterGetPosPx(ch);
};

export const characterGetPosCenterPx = (ch: Character): Point => {
  const [x, y, z] = characterGetPosTopLeft(ch);
  const [px, py] = isoToPixelCoords(x, y, z);
  const [w, h] = characterGetSize(ch);
  return [px + w / 2, py + h / 2];
};

export const characterGetPosTopLeft = (ch: Character) => {
  const [x, y, z] = characterGetPos(ch);
  const [spriteWidth, spriteHeight] = characterGetSize(ch);
  // game assumes each character is 32 x 32 px, if not, the top left corner is adjusted
  // by the isometric transform of the size of the sprite
  return [x - (spriteWidth - 32), y - (spriteHeight - 32) / 2, z];
};

export const characterGetSize = (ch: Character): Point => {
  return [ch.spriteWidth, ch.spriteHeight];
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
  if (ch.walkRetries > 0) {
    ch.walkRetries = 0;
  }
  if (characterCollidesWithPoint(ch, [...point2, 1.5])) {
    characterFinishWalking(ch);
  }
};

export const characterSetWalkTargetAsync = async (
  ch: Character,
  point: Point
) => {
  return new Promise<void>(resolve => {
    characterSetWalkTarget(ch, point, resolve);
  });
};

export const characterHasWalkTarget = (ch: Character) => {
  return !!ch.walkTarget;
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
  characterStopWalking(ch);
};

export const characterStartAi = (ch: Character) => {
  ch.aiEnabled = true;
  characterRestoreState(ch);
};

const characterFinishWalking = (ch: Character) => {
  characterSetAnimationState(ch, AnimationState.IDLE);
  const target = ch.walkTarget;
  characterSetPos(ch, [target?.[0] ?? 0, target?.[1] ?? 0, ch.z]);
  if (ch.onReachWalkTarget) {
    ch.onReachWalkTarget();
  }
  ch.walkTarget = null;
  ch.onReachWalkTarget = null;
};

export const characterStopWalking = (ch: Character) => {
  ch.walkTarget = null;
  characterSetAnimationState(ch, AnimationState.IDLE);
};

export const characterHasTimer = (ch: Character, timer: Timer) => {
  return ch.timers.includes(timer);
};

export const characterStoreState = (ch: Character) => {
  ch.storedState.facing = ch.facing;
  ch.storedState.walkTarget = ch.walkTarget;
};

export const characterRestoreState = (ch: Character) => {
  if (ch.storedState.facing) {
    characterSetFacing(ch, ch.storedState.facing);
  }
  if (ch.storedState.walkTarget) {
    ch.walkTarget = ch.storedState.walkTarget;
  }
};

export const characterHasAnimationState = (
  ch: Character,
  animState: AnimationState
) => {
  const oldAnimState = ch.animationState;
  const oldAnimKey = ch.animationKey;
  ch.animationState = animState;
  const newAnimKey = characterGetAnimKey(ch);
  ch.animationState = oldAnimState;
  ch.animationKey = oldAnimKey;
  const ret = hasAnimation(newAnimKey);
  return ret;
};

export const characterGetVisionPoint = (ch: Character): Point => {
  const [x, y] = characterGetPos(ch);
  const [incX, incY] = facingToIncrements(pxFacingToWorldFacing(ch.facing));
  return [x + (ch.visionRange * incX) / 2, y + (ch.visionRange * incY) / 2];
};

export const characterCanSeeOther = (
  ch: Character,
  other: Character
): boolean => {
  const [x, y] = characterGetPos(other);
  const [visX, visY] = characterGetVisionPoint(ch);
  const r = ch.visionRange;
  return circleCircleCollision([x, y, 1], [visX, visY, r]);
};

export const characterCollidesWithOther = (ch: Character, other: Character) => {
  return circleCircleCollision(
    characterGetCollisionCircle(ch),
    characterGetCollisionCircle(other)
  );
  //  (
  // circleRectCollision(
  //   [x2, y2, chR2],
  //   [x - chW / 2, y - chH / 2, chW, chH]
  // ) !== 'none'
  // );
};

// used only for character -> character collision
export const characterGetCollisionCircle = (ch: Character): Point3d => {
  const [x, y] = characterGetPos(ch);
  const [chW, chH] = ch.collisionSize;
  const chR = Math.min(chW / 2, chH / 2);
  return [x + ch.collisionOffset[0], y + ch.collisionOffset[1], chR];
};

export const characterClearTimers = (ch: Character) => {
  ch.timers = [];
};

export const characterSetOverworldAi = (ch: Character, ai: OverworldAI) => {
  ch.overworldAi = ai;
  if (ai.onCreate) {
    ai.onCreate(ch);
  }
};

export const characterItemIsEquipped = (ch: Character, item: Item) => {
  for (const i in ch.equipment) {
    if (ch.equipment[i] === item) {
      return true;
    }
  }
  return false;
};

export const characterEquipItem = (
  ch: Character,
  item: Item,
  accessoryIndex?: number
) => {
  if (item.type === ItemType.WEAPON) {
    ch.equipment.weapon = item;
  } else if (item.type === ItemType.ARMOR) {
    ch.equipment.armor = item;
  } else if (item.type === ItemType.ACCESSORY) {
    if (accessoryIndex === 0) {
      ch.equipment.accessory1 = item;
    } else if (accessoryIndex === 1) {
      ch.equipment.accessory2 = item;
    }
  }

  ch.skills = [];
  const weaponSkills = ch.equipment?.weapon?.skills ?? [];
  const armorSkills = ch.equipment?.armor?.skills ?? [];
  const skills = weaponSkills.concat(armorSkills);
  for (const i in skills) {
    ch.skills.push(skills[i]);
  }
};

export const characterUnEquipItem = (
  ch: Character,
  item: Item,
  accessoryIndex?: number
) => {
  if (item.type === ItemType.WEAPON) {
    ch.equipment.weapon = undefined;
  } else if (item.type === ItemType.ARMOR) {
    ch.equipment.armor = undefined;
  } else if (item.type === ItemType.ACCESSORY) {
    if (accessoryIndex === 0) {
      ch.equipment.accessory1 = undefined;
    } else if (accessoryIndex === 1) {
      ch.equipment.accessory2 = undefined;
    }
  }
  ch.skills = [];
  const weaponSkills = ch.equipment?.weapon?.skills ?? [];
  const armorSkills = ch.equipment?.armor?.skills ?? [];
  const skills = weaponSkills.concat(armorSkills);
  for (const i in skills) {
    ch.skills.push(skills[i]);
  }
};

export const characterGetStatModifier = (
  ch: Character,
  statName: string
): number => {
  let mod = 0;
  for (const i in ch.equipment) {
    const item: Item | undefined = ch.equipment[i];
    if (item) {
      const m = item.modifiers?.[statName];
      if (m !== undefined) {
        mod += m;
      }
    }
  }
  return mod;
};

export const characterGetStat = (ch: Character, statName: string): number => {
  const statVal = ch.stats[statName] ?? 0;
  return statVal + characterGetStatModifier(ch, statName);
};

const characterGetNextLevelExpThreshold = (level: number) => {
  // Disgea formula http://howtomakeanrpg.com/a/how-to-make-an-rpg-levels.html
  return Math.round(0.04 * level ** 3 + 0.8 * level ** 2 + 2 * level);
};

export const characterGetLevel = (ch: Character | number) => {
  let lvl = 1;
  let threshold = 0;
  const max = 100;

  const exp: number = (ch as any)?.experience || ch;

  if (exp < 3) {
    return 1;
  }

  // HACK: I don't want to figure out the inverse of the lvl function *shudders*
  threshold = characterGetNextLevelExpThreshold(lvl);
  while (exp >= threshold && lvl < max) {
    lvl++;
    threshold = characterGetNextLevelExpThreshold(lvl);
  }
  return lvl;
};

export const characterGetExperiencePct = (ch: Character) => {
  const lvl = characterGetLevel(ch);
  const thresholdPrev = characterGetNextLevelExpThreshold(lvl - 1);
  const thresholdNext = characterGetNextLevelExpThreshold(lvl);
  return normalize(ch.experience, thresholdPrev, thresholdNext, 0, 1);
};

// console.log('LVL', characterGetNextLevelExpThreshold(1), characterGetLevel(3));

// console.log(
//   'THRESHOLDS',
//   characterGetNextLevelExpThreshold(1),
//   characterGetNextLevelExpThreshold(2),
//   characterGetNextLevelExpThreshold(3),
//   characterGetNextLevelExpThreshold(4),
//   characterGetNextLevelExpThreshold(5),
//   characterGetLevel(0),
//   characterGetLevel(3),
//   characterGetLevel(8),
//   characterGetLevel(14),
//   characterGetLevel(23)
// );

export const characterGetPortraitSpriteName = (ch: Character): string => {
  const spriteName = ch.spriteBase + '_portrait';
  console.log('GET PORT SPRITE', spriteName);
  if (!hasAnimation(spriteName)) {
    return '';
  }
  return spriteName;
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
      characterFinishWalking(ch);
      ch.vx = 0;
      ch.vy = 0;
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
    if (isLeaderCharacter(ch)) {
      if (isChObstructedByWall(ch, room)) {
        ch.x = prevX;
        ch.y = prevY;
        if (isChObstructedByWall(ch, room)) {
          console.log(
            'Leader is standing in a wall, warping to nearest adj tile.'
          );
          const tile = roomGetTileBelow(room, [ch.x, ch.y]);
          const adjTile = roomGetEmptyAdjacentTile(room, ch);
          if (tile && adjTile) {
            characterSetPos(ch, [
              ...tileToWorldCoords(adjTile.x, adjTile.y),
              ch.z,
            ]);
            return;
          }
        }
      }

      // const tile = roomGetTileBelow(room, [ch.x, ch.y]);
      // let tileBelowY1: Tile | null = null;
      // let tileBelowX1: Tile | null = null;
      // let tileBelowXY1: Tile | null = null;
      // if (tile) {
      //   // if (isWallOrProp(tile)) {

      //   // }
      //   tileBelowY1 = roomGetTileAt(
      //     room,
      //     tile.x,
      //     Math.floor((ch.y + 22) / TILE_HEIGHT_WORLD)
      //   );
      //   tileBelowX1 = roomGetTileAt(
      //     room,
      //     Math.floor((ch.x + 22) / TILE_WIDTH_WORLD),
      //     tile.y
      //   );
      //   tileBelowXY1 = roomGetTileAt(
      //     room,
      //     Math.floor((ch.x + 22) / TILE_WIDTH_WORLD),
      //     Math.floor((ch.y + 22) / TILE_HEIGHT_WORLD)
      //   );
      // }
      // const isObstructedByWall =
      //   isWallOrProp(tileBelowY1) ||
      //   isWallOrProp(tileBelowX1) ||
      //   isWallOrProp(tileBelowXY1);
      // if (tile?.isWall || isObstructedByWall) {
      //   // if (tile && tileBelowY1) {
      //   //   tile.highlighted = true;
      //   //   tileBelowY1.highlighted = true;
      //   // }
      //   // if (ch.x !== prevX || ch.y !== prevY) {
      //   ch.x = prevX;
      //   ch.y = prevY;
      // }
      // ch.x = parseFloat(ch.x.toFixed(2));
      // ch.y = parseFloat(ch.y.toFixed(2));
    } else {
      // const distanceToWall = roomGetDistanceToNearestWallInFacingDirection(
      //   room,
      //   ch
      // );
      // if (distanceToWall < 25) {
      //   ch.x = prevX;
      //   ch.y = prevY;
      // }
      // const tileTop = roomGetTileBelow(room, [ch.x, ch.y]);
      const sz = 12;
      const tiles = [
        // roomGetTileBelow(room, [ch.x - sz, ch.y + 0]),
        // roomGetTileBelow(room, [ch.x + 0, ch.y - sz]),
        // roomGetTileBelow(room, [ch.x - sz, ch.y - sz]),
        roomGetTileBelow(room, [ch.x - 0, ch.y + 0]),
        // roomGetTileBelow(room, [ch.x + sz, ch.y + 0]),
        // roomGetTileBelow(room, [ch.x + 0, ch.y + sz]),
        // roomGetTileBelow(room, [ch.x + sz, ch.y + sz]),
      ];
      const isObstructedByWall = tiles.reduce(
        (prev, tile) => prev || isWallOrProp(tile),
        false
      );
      if (isObstructedByWall) {
        ch.x = prevX;
        ch.y = prevY;
        if (ch.encounter) {
          characterStopWalking(ch);
          characterStopAi(ch);
          ch.encounterStuckRetries++;
          if (ch.encounterStuckRetries > 50) {
            roomRemoveCharacter(room, ch);
          }
          timeoutPromise(250 + Math.random() * 250).then(() => {
            const room = getCurrentRoom();
            if (room && room.characters.includes(ch)) {
              const tileBelow = roomGetTileBelow(room, [ch.x, ch.y]);
              console.log(
                'This encounter character is stuck, resetting to',
                tileBelow?.x,
                tileBelow?.y
              );
              if (tileBelow) {
                const tilePos = extrapolatePoint(
                  tileToWorldCoords(tileBelow.x, tileBelow.y)
                );
                // this is an extremely odd fix that I'm not sure why it works, but it looks
                // like characters on paths rounding a diagonal wall at the top side sometimes
                // cut the corner and get stuck in the wall (each dir).  This code bumps them
                // up to the top of the diagonal which fixes their path.  TODO here
                // is to move them smoothly up there instead of bumping them
                if (
                  ch.facing === Facing.RIGHT ||
                  ch.facing === Facing.RIGHT_DOWN
                ) {
                  tilePos[1] += 4;
                } else if (
                  ch.facing === Facing.LEFT ||
                  ch.facing === Facing.LEFT_DOWN
                ) {
                  tilePos[0] += 4;
                }
                // else if (
                //   ch.facing === Facing.UP ||
                //   ch.facing === Facing.LEFT_UP
                // ) {
                //   tilePos[1] += 16;
                // } else if (ch.facing === Facing.RIGHT_UP) {
                //   tilePos[0] += 16;
                // }
                characterSetPos(ch, tilePos);
              }
              characterStartAi(ch);
            }
          });
          // }
        }
        // const timer = new Timer(500);
        // timer.awaits.push(() => {
        //   console.log('RESTART AI');
        //   characterStartAi(ch);
        // });
        // characterAddTimer(ch, timer);
      }
    }
  }
  const [x, y] = characterGetPos(ch);
  const [, py] = isoToPixelCoords(x, y, 0);
  if (ch.ro) {
    ch.ro.sortY = py + 32;
  }
  ch.vx = 0;
  ch.vy = 0;

  // const leader = getCurrentPlayer().leader;
  // if (ch !== leader && characterCollidesWithOther(ch, leader)) {
  //   console.log('collides with leader');
  // }
};

const isWallOrProp = (tile: Tile | null) => {
  return tile?.isWall && !tile?.isProp;
};

const isLeaderCharacter = (ch: Character) => {
  return ch.spriteBase === 'ada';
};

const isChObstructedByWall = (ch: Character, room: Room) => {
  const tile = roomGetTileBelow(room, [ch.x, ch.y]);
  let tileBelowY1: Tile | null = null;
  let tileBelowX1: Tile | null = null;
  let tileBelowXY1: Tile | null = null;
  if (tile) {
    // if (isWallOrProp(tile)) {
    //   console.log(
    //     'Leader is standing in a wall, warping to nearest adj tile.'
    //   );
    //   const adjTile = roomGetEmptyAdjacentTile(room, ch);
    //   if (adjTile) {
    //     characterSetPos(ch, [...tileToWorldCoords(tile.x, tile.y), ch.z]);
    //     return;
    //   }
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
    tileBelowXY1 = roomGetTileAt(
      room,
      Math.floor((ch.x + 22) / TILE_WIDTH_WORLD),
      Math.floor((ch.y + 22) / TILE_HEIGHT_WORLD)
    );
  }
  const isObstructedByWall =
    isWallOrProp(tileBelowY1) ||
    isWallOrProp(tileBelowX1) ||
    isWallOrProp(tileBelowXY1);
  if (tile?.isWall || isObstructedByWall) {
    // if (tile && tileBelowY1) {
    //   tile.highlighted = true;
    //   tileBelowY1.highlighted = true;
    // }
    // if (ch.x !== prevX || ch.y !== prevY) {
    return true;
  }
};
