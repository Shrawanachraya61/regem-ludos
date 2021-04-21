import { Room } from 'model/room';
import { BattleAI } from 'controller/battle-ai';
import { BattleCharacter, battleCharacterIsActing } from './battle-character';
import { CharacterTemplate, Character, AnimationState } from './character';
import { setAtMarker } from 'controller/scene-commands';
import { getCurrentPlayer } from './generics';
import { BattleActionType } from 'controller/battle-actions';

export interface Battle {
  room: Room;
  isCompleted: boolean;
  allies: BattleCharacter[];
  enemies: BattleCharacter[];
  defeated: BattleCharacter[];
  subscriptions: IBattleSubscriptionHub;
  targetedEnemyIndex: number;
  targetedEnemyRangeIndex: number;
  isPaused: boolean;
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
  onCharacterPinned = 'onCharacterPinned',
  onCharacterRecovered = 'onCharacterRecovered',
  onCharacterCasting = 'onCharacterCasting',
  onCharacterSpell = 'onCharacterSpell',
  onCharacterInterrupted = 'onCharacterInterrupted',
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
  [BattleEvent.onCharacterPinned]: ((bCh: BattleCharacter) => void)[];
  [BattleEvent.onCharacterRecovered]: ((bCh: BattleCharacter) => void)[];
  [BattleEvent.onCharacterSpell]: ((bCh: BattleCharacter) => void)[];
  [BattleEvent.onCharacterCasting]: ((bCh: BattleCharacter) => void)[];
  [BattleEvent.onCharacterInterrupted]: ((bCh: BattleCharacter) => void)[];
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
  ai?: BattleAI;
  armor?: number;
}

export interface BattleTemplate {
  roomName: string;
  enemies: BattleTemplateEnemy[];
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
}

export enum Status {
  DEFEND = 'defend',
}

export interface BattleStats {
  POW: number;
  ACC: number;
  FOR: number;
  CON: number;
  RES: number;
  SPD: number;
  EVA: number;
  HP: number;
  STAGGER: number; // stagger hp
}

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
    onCharacterRecovered: [],
    onCharacterPinned: [],
    onCharacterSpell: [],
    onCharacterCasting: [],
    onCharacterInterrupted: [],
    onCharacterDefeated: [],
    onMagicShieldDamaged: [],
    onTurnStarted: [],
    onTurnEnded: [],
    onCompletion: [],
  };

  return {
    room,
    isCompleted: false,
    enemies,
    defeated: [] as BattleCharacter[],
    allies,
    subscriptions,
    targetedEnemyIndex: 0,
    targetedEnemyRangeIndex: 0,
    isPaused: false,
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
    EVA: 0,
    HP: 10,
    STAGGER: 10,
  };
};

export const battleSetActorPositions = (battle: Battle): void => {
  const player = getCurrentPlayer();
  battle.allies.forEach((bCh, i) => {
    const ind = player.battlePositions.indexOf(bCh.ch);
    setAtMarker(bCh.ch.name, 'MarkerAlly' + (ind > -1 ? ind : i));
    bCh.position =
      ind < 2
        ? BattlePosition.FRONT
        : ind < 4
        ? BattlePosition.MIDDLE
        : BattlePosition.BACK;
  });
  battle.enemies.forEach((bCh, i) => {
    setAtMarker(bCh.ch.name, 'MarkerEnemy' + i);
    bCh.position =
      i < 2
        ? BattlePosition.FRONT
        : i < 4
        ? BattlePosition.MIDDLE
        : BattlePosition.BACK;
  });
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
  const events = battle.subscriptions[eventName];
  events.forEach((cb: (arg: any) => void) => {
    cb(arg);
  });
};

export const battleGetActingAllegiance = (
  battle: Battle
): BattleAllegiance | null => {
  const areAlliesActing = battle.allies.reduce((isActing, bCh) => {
    return isActing || battleCharacterIsActing(bCh);
  }, false);
  if (areAlliesActing) {
    return BattleAllegiance.ALLY;
  }
  const areEnemiesActing = battle.enemies.reduce((isActing, bCh) => {
    return isActing || battleCharacterIsActing(bCh);
  }, false);
  if (areEnemiesActing) {
    return BattleAllegiance.ENEMY;
  }

  return null;
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
  if (battleGetActingAllegiance(battle) === BattleAllegiance.ENEMY) {
    console.log('Cannot set battle target index during enemy acting phase.');
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
  if (battleGetActingAllegiance(battle) === BattleAllegiance.ENEMY) {
    console.log(
      'Cannot set ranged battle target index during enemy acting phase.'
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
  (characters ?? battle.allies.concat(battle.enemies)).forEach(
    (bCh: BattleCharacter) => {
      bCh.actionTimer.pauseOverride();
      bCh.staggerTimer.pauseOverride();
      bCh.castTimer.pauseOverride();
      bCh.actionReadyTimer.pauseOverride();
      if (bCh.ch.transform) {
        bCh.ch.transform.timer.pauseOverride();
      }
    }
  );
};

export const battleUnpauseTimers = (
  battle: Battle,
  characters?: BattleCharacter[]
) => {
  (characters ?? battle.allies.concat(battle.enemies)).forEach(
    (bCh: BattleCharacter) => {
      bCh.actionTimer.unpauseOverride();
      bCh.staggerTimer.unpauseOverride();
      bCh.castTimer.unpauseOverride();
      bCh.actionReadyTimer.unpauseOverride();
      if (bCh.ch.transform) {
        bCh.ch.transform.timer.unpauseOverride();
      }
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
