import {
  Room,
  roomAddParticle,
  roomRemoveCharacter,
  roomRemoveParticle,
} from 'model/room';
import { BattleAI } from 'db/battle-ai';
import {
  BattleCharacter,
  battleCharacterIsActing,
  battleCharacterIsPreventingTurn,
} from './battle-character';
import {
  CharacterTemplate,
  Character,
  AnimationState,
  characterGetPosCenterPx,
  characterGetPosTopLeftPx,
} from './character';
import { setAtMarker } from 'controller/scene/scene-commands';
import { getCurrentPlayer, getNow } from './generics';
import { BattleActionType, SwingType } from 'controller/battle-actions';
import { Animation } from 'model/animation';
import { Particle, particleCreateFromTemplate } from 'model/particle';
import { renderUi } from 'view/ui';
import { Timer } from './utility';
import { Item } from 'db/items';

export interface Battle {
  room: Room;
  isStarted: boolean;
  isCompleted: boolean;
  allies: BattleCharacter[];
  alliesStorage: BattleCharacter[];
  enemies: BattleCharacter[];
  enemiesStorage: BattleCharacter[];
  defeated: BattleCharacter[];
  subscriptions: IBattleSubscriptionHub;
  persistentEffects: PersistentEffectEventHub;
  targetedEnemyIndex: number;
  targetedEnemyRangeIndex: number;
  isPaused: boolean;
  itemTimer: Timer;
  transitioning: boolean;
  template?: BattleTemplate;
}

export enum PersistentEffectEvent {
  onBeforeCharacterEvades = 'onBeforeCharacterEvades',
  onBeforeCharacterDamaged = 'onBeforeCharacterDamaged',
}

export type OnBeforeCharacterEvadesCb = (
  bCh: BattleCharacter,
  currentEvasionRate: number,
  damageType: BattleDamageType
) => number | undefined;

export type OnBeforeCharacterDamagedCb = (
  bCh: BattleCharacter,
  currentDamageValue: number,
  damageType: BattleDamageType
) => number | undefined;

export interface PersistentEffectEventParams<T> {
  cb: T;
  source: BattleCharacter;
  description: string;
  affectedAllegiance: BattleAllegiance;
  name: string;
  icon: string;
  anim: Animation;
  particle?: Particle;
}

export interface PersistentEffectEventHub {
  // for changing the evasion rate when an effect is active
  [PersistentEffectEvent.onBeforeCharacterEvades]: PersistentEffectEventParams<OnBeforeCharacterEvadesCb>[];
  // for changing how much damage is dealt to a character after all damage calculations
  // have been made
  [PersistentEffectEvent.onBeforeCharacterDamaged]: PersistentEffectEventParams<OnBeforeCharacterDamagedCb>[];
}

export enum BattleEvent {
  onCharacterDamaged = 'onCharacterDamaged',
  onCharacterReady = 'onCharacterReady',
  onCharacterActionStarted = 'onCharacterActionStarted',
  onCharacterAction = 'onCharacterAction',
  onCharacterActionReady = 'onCharacterActionReady',
  onCharacterActionButtonPressed = 'onCharacterActionButtonPressed',
  onCharacterActionEnded = 'onCharacterActionEnded',
  onCharacterStaggered = 'onCharacterStaggered',
  onCharacterKnockedDown = 'onCharacterKnockedDown',
  onCharacterPinned = 'onCharacterPinned',
  onCharacterRecovered = 'onCharacterRecovered',
  onCharacterCasting = 'onCharacterCasting',
  onCharacterChannelling = 'onCharacterChannelling',
  onCharacterSpell = 'onCharacterSpell',
  onCharacterInterrupted = 'onCharacterInterrupted',
  onCharacterEvaded = 'onCharacterEvaded',
  onCharacterDefeated = 'onCharacterDefeated',
  onMagicShieldDamaged = 'onMagicShieldDamaged',
  onTurnStarted = 'onTurnStarted',
  onTurnEnded = 'onTurnEnded',
  onCompletion = 'onCompletion',
}

export interface IBattleSubscriptionHub {
  [BattleEvent.onCharacterDamaged]: ((bCh: BattleCharacter) => void)[];
  [BattleEvent.onCharacterReady]: ((bCh: BattleCharacter) => void)[];
  [BattleEvent.onCharacterActionStarted]: ((bCh: BattleCharacter) => void)[];
  [BattleEvent.onCharacterAction]: ((bCh: BattleCharacter) => void)[];
  [BattleEvent.onCharacterActionReady]: ((bCh: BattleCharacter) => void)[];
  [BattleEvent.onCharacterActionButtonPressed]: ((
    bCh: BattleCharacter
  ) => void)[];
  [BattleEvent.onCharacterActionEnded]: ((bCh: BattleCharacter) => void)[];
  [BattleEvent.onCharacterStaggered]: ((bCh: BattleCharacter) => void)[];
  [BattleEvent.onCharacterKnockedDown]: ((bCh: BattleCharacter) => void)[];
  [BattleEvent.onCharacterPinned]: ((bCh: BattleCharacter) => void)[];
  [BattleEvent.onCharacterRecovered]: ((bCh: BattleCharacter) => void)[];
  [BattleEvent.onCharacterSpell]: ((bCh: BattleCharacter) => void)[];
  [BattleEvent.onCharacterCasting]: ((bCh: BattleCharacter) => void)[];
  [BattleEvent.onCharacterChannelling]: ((bCh: BattleCharacter) => void)[];
  [BattleEvent.onCharacterInterrupted]: ((bCh: BattleCharacter) => void)[];
  [BattleEvent.onCharacterEvaded]: ((bCh: BattleCharacter) => void)[];
  [BattleEvent.onCharacterDefeated]: ((bCh: BattleCharacter) => void)[];
  [BattleEvent.onMagicShieldDamaged]: ((
    allegiance: BattleAllegiance
  ) => void)[];
  [BattleEvent.onTurnStarted]: ((allegiance: BattleAllegiance) => void)[];
  [BattleEvent.onTurnEnded]: ((allegiance: BattleAllegiance) => void)[];
  [BattleEvent.onCompletion]: ((battle: Battle) => void)[];
}

export interface BattleTemplateEnemy {
  chTemplate: CharacterTemplate;
  position: BattlePosition;
  ai?: string;
  armor?: number;
}

export interface BattleTemplate {
  roomName: string;
  enemies: BattleTemplateEnemy[];
  baseExperience: number;
  baseTokens: number;
  getDrops?: () => Item[];
  disableFlee?: boolean;
  music?: string;
  events?: {
    onBattleStart?: (battle: Battle) => Promise<void>;
    onBattleEnd?: (battle: Battle) => Promise<void>;
    onCharacterDamaged?: (bCh: BattleCharacter) => Promise<void>;
    onTurnEnded?: (allegiance: BattleAllegiance) => Promise<void>;
    onCharacterDefeated?: (bCh: BattleCharacter) => Promise<void>;
    onAfterBattleEnded?: () => Promise<void>;
  };
}

export enum BattlePosition {
  FRONT = 'front',
  MIDDLE = 'middle',
  BACK = 'back',
}

export enum BattleRow {
  TOP = 'top',
  BOTTOM = 'bottom',
  NONE = 'none',
}

export enum BattleAllegiance {
  ALLY = 'ally',
  ENEMY = 'enemy',
  NONE = 'none',
}

export enum BattleStatus {
  DEFEND = 'defend',
  HASTE = 'haste',
}

export enum BattleDamageType {
  RANGED = 'ranged',
  SWING = 'swing',
  MAGIC = 'magic',
}

export interface BattleStats {
  POW: number; // increase this to do more bonus weapon damage
  ACC: number;
  FOR: number; // damage reduction for physical
  CON: number; // reduces time spent staggered
  RES: number; // damage reduction for magic
  SPD: number; // cooldown reduction on ability usage
  EVA: number; // evasion (max at 50%)
  HP: number;
  STAGGER: number; // stagger hp
  RESV: number;
}

export type StatName =
  | 'HP'
  | 'POW'
  | 'ACC'
  | 'FOR'
  | 'CON'
  | 'RES'
  | 'SPD'
  | 'EVA'
  | 'STAGGER'
  | 'RESV';

export const battleCreate = (
  room: Room,
  allies: BattleCharacter[],
  enemies: BattleCharacter[]
): Battle => {
  const subscriptions: IBattleSubscriptionHub = {
    onCharacterDamaged: [],
    onCharacterReady: [],
    onCharacterActionStarted: [],
    onCharacterAction: [],
    onCharacterActionReady: [],
    onCharacterActionButtonPressed: [],
    onCharacterActionEnded: [],
    onCharacterStaggered: [],
    onCharacterKnockedDown: [],
    onCharacterRecovered: [],
    onCharacterPinned: [],
    onCharacterSpell: [],
    onCharacterCasting: [],
    onCharacterChannelling: [],
    onCharacterInterrupted: [],
    onCharacterEvaded: [],
    onCharacterDefeated: [],
    onMagicShieldDamaged: [],
    onTurnStarted: [],
    onTurnEnded: [],
    onCompletion: [],
  };

  const persistentEffects: PersistentEffectEventHub = {
    onBeforeCharacterEvades: [],
    onBeforeCharacterDamaged: [],
  };

  return {
    room,
    isStarted: false,
    isCompleted: false,
    enemies,
    enemiesStorage: [...enemies],
    defeated: [] as BattleCharacter[],
    allies,
    alliesStorage: [...allies],
    subscriptions,
    persistentEffects,
    targetedEnemyIndex: 0,
    targetedEnemyRangeIndex: 0,
    itemTimer: new Timer(10000),
    isPaused: false,
    transitioning: false,
  };
};

export const battleStatsCreate = (): BattleStats => {
  return {
    POW: 5,
    ACC: 1,
    FOR: 1,
    CON: 1,
    RES: 1,
    SPD: 1,
    EVA: 1,
    HP: 10,
    STAGGER: 10,
    RESV: 10,
  };
};

export const battleSetActorPositions = (battle: Battle): void => {
  const player = getCurrentPlayer();
  battle.allies.forEach((bCh, i) => {
    const ind = player.battlePositions.indexOf(bCh.ch);
    setAtMarker(bCh.ch.name, 'MarkerAlly' + (ind > -1 ? ind : i));
    bCh.positionMarker = i;
  });

  battle.enemies.forEach(bCh => {
    battleSetEnemyActorPosition(battle, bCh);
  });
};

export const battleSetEnemyActorPosition = (
  battle: Battle,
  bCh: BattleCharacter
) => {
  const pos = bCh.position;
  let offset = 0;
  if (pos === BattlePosition.MIDDLE) {
    offset = 2;
  } else if (pos === BattlePosition.BACK) {
    offset = 4;
  }

  const existingEnemyAtPosition = battle.enemies.find(
    bCh => bCh.positionMarker === offset
  );
  if (existingEnemyAtPosition) {
    offset++;
  }

  if (battle.enemies.find(bCh => bCh.positionMarker === offset)) {
    console.error(
      'WARNING: Setting battle character at a position which is already occupied.',
      bCh
    );
  }

  setAtMarker(bCh.ch.name, 'MarkerEnemy' + offset);
  bCh.positionMarker = offset;
};

export const battleIsVictory = (battle: Battle): boolean => {
  return battle.enemies.length === 0;
};

export const battleIsLoss = (battle: Battle): boolean => {
  return battle.allies.length === 0;
};

export const battleGetAllegiance = (
  battle: Battle,
  ch: Character
): BattleAllegiance => {
  if (
    battle.enemies.find((bCh: BattleCharacter) => {
      return bCh.ch === ch;
    })
  ) {
    return BattleAllegiance.ENEMY;
  }
  if (
    battle.allies.find((bCh: BattleCharacter) => {
      return bCh.ch === ch;
    })
  ) {
    return BattleAllegiance.ALLY;
  }
  throw new Error(
    `Cannot get battle allegiance for character '${ch.name}' that does not exist in battle.`
  );
};

export const battleGetOppositeAllegiance = (
  allegiance: BattleAllegiance
): BattleAllegiance => {
  return allegiance === BattleAllegiance.ALLY
    ? BattleAllegiance.ENEMY
    : BattleAllegiance.ALLY;
};

export const battleGetCharactersOfAllegiance = (
  battle: Battle,
  allegiance: BattleAllegiance
): BattleCharacter[] => {
  switch (allegiance) {
    case BattleAllegiance.ALLY: {
      return battle.allies;
    }
    case BattleAllegiance.ENEMY: {
      return battle.enemies;
    }
    default: {
      return battle.allies;
    }
  }
};

export const battleGetTargetableCharacters = (
  battle: Battle,
  allegiance: BattleAllegiance,
  actionType: BattleActionType
) => {
  const arr = battleGetCharactersOfAllegiance(
    battle,
    battleGetOppositeAllegiance(allegiance)
  );
  if (actionType === BattleActionType.SWING) {
    let target: BattleCharacter[];
    target = arr.filter((bCh: BattleCharacter) => {
      return bCh.position === BattlePosition.FRONT;
    });
    if (!target.length) {
      target = target.concat(
        arr.filter((bCh: BattleCharacter) => {
          return bCh.position === BattlePosition.MIDDLE;
        })
      );
    }
    if (!target.length) {
      target = arr.filter((bCh: BattleCharacter) => {
        return bCh.position === BattlePosition.BACK;
      });
    }
    return target ?? null;
  } else {
    return arr;
  }
};

export const battleGetNearestAttackable = (
  battle: Battle,
  allegiance: BattleAllegiance
): BattleCharacter | null => {
  const arr = battleGetCharactersOfAllegiance(
    battle,
    battleGetOppositeAllegiance(allegiance)
  );
  let target: BattleCharacter | undefined;
  target = arr.find((bCh: BattleCharacter) => {
    return bCh.position === BattlePosition.FRONT;
  });
  if (!target) {
    target = arr.find((bCh: BattleCharacter) => {
      return bCh.position === BattlePosition.MIDDLE;
    });
  }
  if (!target) {
    target = arr.find((bCh: BattleCharacter) => {
      return bCh.position === BattlePosition.BACK;
    });
  }
  return target ?? null;
};

export const battleGetCharactersByPosition = (
  arr: BattleCharacter[],
  position: BattlePosition
): BattleCharacter[] => {
  return arr.filter((bCh: BattleCharacter) => {
    return bCh.position === position;
  });
};

export const battleSubscribeEvent = (
  battle: Battle,
  eventName: BattleEvent,
  cb: (arg: any) => void
) => {
  battle.subscriptions[eventName].push(cb);
};

export const battleUnsubscribeEvent = (
  battle: Battle,
  eventName: BattleEvent,
  cb: (arg: any) => void
) => {
  const ind = battle.subscriptions[eventName].indexOf(cb);
  if (ind > -1) {
    battle.subscriptions[eventName].splice(ind, 1);
  }
};

export const battleInvokeEvent = (
  battle: Battle,
  eventName: BattleEvent,
  arg: any
) => {
  console.log('invoke event', eventName, arg);
  // REALLY IMPORTANT: this has to be a copy or you get bugs when an event removes
  // itself while the event is firing.
  const events = battle.subscriptions[eventName].slice();
  events.forEach((cb: (arg: any) => void) => {
    cb(arg);
  });
};

export function battleAddPersistentEffect<T>(
  battle: Battle,
  eventName: PersistentEffectEvent,
  params: PersistentEffectEventParams<T>
) {
  battle.persistentEffects[eventName].push(params as any);
  // const particle = particleCreate();
  // particle.timer.start(Infinity);

  const [px, py] = characterGetPosTopLeftPx(params.source.ch);
  const particle = particleCreateFromTemplate([px, py], {
    duration: Infinity,
    opacity: 0.5,
  });
  particle.anim = params.anim;
  particle.anim?.start();
  params.particle = particle;
  roomAddParticle(battle.room, particle);
}

export function battleRemovePersistentEffect<T>(
  battle: Battle,
  eventName: PersistentEffectEvent,
  params: PersistentEffectEventParams<T>
) {
  const ind = battle.persistentEffects[eventName].indexOf(params as any);
  if (ind > -1) {
    battle.persistentEffects[eventName].splice(ind, 1);
    if (params.particle) {
      roomRemoveParticle(battle.room, params.particle);
    }
  }
}

export function battleGetPersistentEffects<T>(
  battle: Battle,
  eventName: PersistentEffectEvent,
  allegiance: BattleAllegiance
): PersistentEffectEventParams<T>[] {
  // REALLY IMPORTANT: this has to be a copy or you get bugs when an event removes
  // itself while the event is firing.
  const events = battle.persistentEffects[eventName].slice().filter(params => {
    return params.affectedAllegiance === allegiance;
  });
  return events as any;
}

export function battleGetAllPersistentEffectsForAllegiance<T>(
  battle: Battle,
  allegiance: BattleAllegiance
): PersistentEffectEventParams<T>[] {
  let ret: PersistentEffectEventParams<T>[] = [];
  for (const i in battle.persistentEffects) {
    ret = ret.concat(battle.persistentEffects[i]);
  }
  return ret.filter(
    params => battleGetAllegiance(battle, params.source.ch) === allegiance
  );
}

export const battleGetActingAllegiance = (
  battle: Battle
): BattleAllegiance | null => {
  const areAlliesActing = battle.allies.reduce((isActing, bCh) => {
    return isActing || battleCharacterIsPreventingTurn(bCh);
  }, false);
  if (areAlliesActing) {
    return BattleAllegiance.ALLY;
  }
  const areEnemiesActing = battle.enemies.reduce((isActing, bCh) => {
    return isActing || battleCharacterIsPreventingTurn(bCh);
  }, false);
  if (areEnemiesActing) {
    return BattleAllegiance.ENEMY;
  }

  return null;
};

export const battleRemoveBattleCharacter = (
  battle: Battle,
  bCh: BattleCharacter
) => {
  let ind = battle.enemies.indexOf(bCh);
  // if ch is an enemy, remove from room
  if (ind > -1) {
    bCh.shouldRemove = true;
    battle.defeated.push(bCh);
    roomRemoveCharacter(battle.room, bCh.ch);
    return;
  }
  ind = battle.allies.indexOf(bCh);
  if (ind > -1) {
    bCh.shouldRemove = true;
    battle.defeated.push(bCh);
  }
};

// melee characters can only target enemies if there are no enemies in front of them
export const battleIsEnemyTargetableByMelee = (
  battle: Battle,
  i: number
): boolean => {
  const enemies = battle.enemies;
  const front = battleGetCharactersByPosition(enemies, BattlePosition.FRONT);
  if (front.length > 0 && i >= front.length) {
    return false;
  } else if (i < front.length) {
    return true;
  }
  const middle = battleGetCharactersByPosition(enemies, BattlePosition.MIDDLE);
  if (middle.length > 0 && i >= middle.length) {
    return false;
  } else if (i < middle.length) {
    return true;
  }
  return true;
};

export const battleSetEnemyTargetIndex = (
  battle: Battle,
  i: number
): boolean => {
  if (
    [BattleAllegiance.ENEMY, BattleAllegiance.ALLY].includes(
      battleGetActingAllegiance(battle) as BattleAllegiance
    )
  ) {
    console.log(
      'Cannot set melee battle target index during enemy/ally acting phase.'
    );
    return false;
  }

  if (!battleIsEnemyTargetableByMelee(battle, i)) {
    console.log('Cannot target characters behind other characters.');
    return false;
  }

  if (battleGetDefeatedCharacters(battle).length) {
    // fixes a bug where spam clicking the target while a character is dying causes
    // the target to decrement at the end of a player phase and therefore invalidate
    // the index
    console.log('Cannot cannot set target when characters are defeated.');
    return false;
  }

  if (i < battle.enemies.length) {
    battle.targetedEnemyIndex = i;
  }
  return true;
};

export const battleSetEnemyRangeTargetIndex = (
  battle: Battle,
  i: number
): boolean => {
  if (
    [BattleAllegiance.ENEMY, BattleAllegiance.ALLY].includes(
      battleGetActingAllegiance(battle) as BattleAllegiance
    )
  ) {
    console.log(
      'Cannot set ranged battle target index during enemy/ally acting phase.'
    );
    return false;
  }

  if (battleGetDefeatedCharacters(battle).length) {
    // fixes a bug where spam clicking the target while a character is dying causes
    // the target to decrement at the end of a player phase and therefore invalidate
    // the index
    console.log(
      'Cannot cannot set ranged target when characters are defeated.'
    );
    return false;
  }

  if (i < battle.enemies.length) {
    battle.targetedEnemyRangeIndex = i;
  }
  return true;
};

export const battleGetTargetedEnemy = (
  battle: Battle,
  type: BattleActionType
): BattleCharacter | null => {
  const i =
    type === BattleActionType.SWING
      ? battle.targetedEnemyIndex
      : battle.targetedEnemyRangeIndex;
  return battle.enemies[i] ?? null;
};

export const battlePauseTimers = (
  battle: Battle,
  characters?: BattleCharacter[]
) => {
  // console.trace(
  //   'BATTLE PAUSE',
  //   characters ?? battle.allies.concat(battle.enemies)
  // );
  battle.itemTimer.pauseOverride();
  (characters ?? battle.allies.concat(battle.enemies)).forEach(
    (bCh: BattleCharacter) => {
      bCh.actionTimer.pauseOverride();
      bCh.staggerTimer.pauseOverride();
      bCh.koTimer.pauseOverride();
      bCh.castTimer.pauseOverride();
      bCh.actionReadyTimer.pauseOverride();
      if (bCh.ch.transform) {
        bCh.ch.transform.timer.pauseOverride();
      }
      bCh.statuses.forEach(obj => {
        obj.timer.pauseOverride();
      });
    }
  );
};

export const battleUnpauseTimers = (
  battle: Battle,
  characters?: BattleCharacter[]
) => {
  console.log(
    'BATTLE UNPAUSE',
    characters ?? battle.allies.concat(battle.enemies)
  );
  battle.itemTimer.unpauseOverride();
  (characters ?? battle.allies.concat(battle.enemies)).forEach(
    (bCh: BattleCharacter) => {
      bCh.actionTimer.unpauseOverride();
      bCh.staggerTimer.unpauseOverride();
      bCh.castTimer.unpauseOverride();
      bCh.koTimer.unpauseOverride();
      bCh.actionReadyTimer.unpauseOverride();
      if (bCh.ch.transform) {
        bCh.ch.transform.timer.unpauseOverride();
      }
      bCh.statuses.forEach(obj => {
        obj.timer.unpauseOverride();
      });
    }
  );
};

export const battlePauseActionTimers = (
  battle: Battle,
  characters?: BattleCharacter[],
  override?: boolean
) => {
  (characters ?? battle.allies.concat(battle.enemies)).forEach(
    (bCh: BattleCharacter) => {
      override ? bCh.actionTimer.pauseOverride() : bCh.actionTimer.pause();
    }
  );
};

export const battleUnpauseActionTimers = (
  battle: Battle,
  characters?: BattleCharacter[],
  override?: boolean
) => {
  (characters ?? battle.allies.concat(battle.enemies)).forEach(
    (bCh: BattleCharacter) => {
      override ? bCh.actionTimer.unpauseOverride() : bCh.actionTimer.unpause();
    }
  );
};

export const battleGetDefeatedCharacters = (battle: Battle) => {
  return battle.allies.concat(battle.enemies).filter((bCh: BattleCharacter) => {
    return bCh.isDefeated;
  });
};

export const battleGetDyingCharacters = (battle: Battle) => {
  return battle.allies.concat(battle.enemies).filter((bCh: BattleCharacter) => {
    return (
      bCh.isDefeated && bCh.ch.animationState === AnimationState.BATTLE_DEAD
    );
  });
};

export const battleCycleMeleeTarget = (battle: Battle) => {
  const meleeTarget = battleGetTargetedEnemy(battle, BattleActionType.SWING);
  const meleeTargetInd =
    battle.enemies.indexOf(meleeTarget as BattleCharacter) ?? 0;
  let nextIndex = meleeTargetInd;
  let nextBCh = battle.enemies[meleeTargetInd];
  let ctr = 0;
  const max = battle.enemies.length;
  let ret = false;
  do {
    ctr++;
    nextIndex = meleeTargetInd + 1;
    nextBCh = battle.enemies[nextIndex];
    if (!nextBCh) {
      nextIndex = 0;
      nextBCh = battle.enemies[nextIndex];
    }
    if (nextBCh) {
      if (battleIsEnemyTargetableByMelee(battle, nextIndex)) {
        ret = battleSetEnemyTargetIndex(battle, nextIndex);
        break;
      }
    }
  } while (nextBCh && ctr <= max);
  return ret;
};

export const battleCycleRangeTarget = (battle: Battle) => {
  const rangeTarget = battleGetTargetedEnemy(battle, BattleActionType.RANGED);
  const rangeTargetIndex =
    battle.enemies.indexOf(rangeTarget as BattleCharacter) ?? 0;
  let nextIndex = rangeTargetIndex;
  let nextBCh = battle.enemies[rangeTargetIndex];
  let ctr = 0;
  const max = battle.enemies.length;
  let ret = false;
  do {
    ctr++;
    nextIndex = rangeTargetIndex + 1;
    nextBCh = battle.enemies[nextIndex];
    if (!nextBCh) {
      nextIndex = 0;
      nextBCh = battle.enemies[nextIndex];
    }
    if (nextBCh) {
      ret = battleSetEnemyRangeTargetIndex(battle, nextIndex);
    }
  } while (nextBCh && ctr <= max);
  return ret;
};

export const battleGetBattleCharacterFromCharacter = (
  battle: Battle,
  ch: Character
) => {
  {
    const bCh = battle.alliesStorage.find(bCh => bCh.ch === ch);
    if (bCh) {
      return bCh;
    }
  }
  {
    const bCh = battle.enemiesStorage.find(bCh => bCh.ch === ch);
    if (bCh) {
      return bCh;
    }
  }

  return null;
};

export const battleResetItemTimer = (battle: Battle) => {
  battle.itemTimer.start();
  battle.itemTimer.timestampPause = getNow();
  battle.itemTimer.pauseOverride();
};

export const battleGetRewards = (battle: Battle) => {
  let items: Item[] = [];
  if (battle.template?.getDrops) {
    items = battle.template?.getDrops();
  }
  const experience = battle.template?.baseExperience ?? 1;
  return {
    items,
    experience,
    tokens: battle.template?.baseTokens ?? 0,
  };
};
