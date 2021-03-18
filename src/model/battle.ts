import { Room } from 'model/room';
import { BattleAI } from 'controller/battle-ai';
import { BattleCharacter, battleCharacterIsActing } from './battle-character';
import { CharacterTemplate, Character } from './character';
import { setAtMarker } from 'controller/scene-commands';
import { getCurrentPlayer } from './generics';

export interface Battle {
  room: Room;
  isCompleted: boolean;
  allies: BattleCharacter[];
  enemies: BattleCharacter[];
  defeated: BattleCharacter[];
  subscriptions: IBattleSubscriptionHub;
}

export enum BattleEvent {
  onCharacterDamaged = 'onCharacterDamaged',
  onCharacterReady = 'onCharacterReady',
  onCharacterStaggered = 'onCharacterStaggered',
  onCharacterPinned = 'onCharacterPinned',
  onCharacterRecovered = 'onCharacterRecovered',
  onCharacterCasting = 'onCharacterCasting',
  onCharacterSpell = 'onCharacterSpell',
  onCharacterAction = 'onCharacterAction',
  onCharacterInterrupted = 'onCharacterInterrupted',
  onCharacterDefeated = 'onCharacterDefeated',
  onMagicShieldDamaged = 'onMagicShieldDamaged',
  onTurnStarted = 'onTurnStarted',
  onTurnEnded = 'onTurnEnded',
}

export interface IBattleSubscriptionHub {
  [BattleEvent.onCharacterDamaged]: ((bCh: BattleCharacter) => void)[];
  [BattleEvent.onCharacterReady]: ((bCh: BattleCharacter) => void)[];
  [BattleEvent.onCharacterStaggered]: ((bCh: BattleCharacter) => void)[];
  [BattleEvent.onCharacterPinned]: ((bCh: BattleCharacter) => void)[];
  [BattleEvent.onCharacterRecovered]: ((bCh: BattleCharacter) => void)[];
  [BattleEvent.onCharacterSpell]: ((bCh: BattleCharacter) => void)[];
  [BattleEvent.onCharacterCasting]: ((bCh: BattleCharacter) => void)[];
  [BattleEvent.onCharacterAction]: ((bCh: BattleCharacter) => void)[];
  [BattleEvent.onCharacterInterrupted]: ((bCh: BattleCharacter) => void)[];
  [BattleEvent.onCharacterDefeated]: ((bCh: BattleCharacter) => void)[];
  [BattleEvent.onMagicShieldDamaged]: ((
    allegiance: BattleAllegiance
  ) => void)[];
  [BattleEvent.onTurnStarted]: ((allegiance: BattleAllegiance) => void)[];
  [BattleEvent.onTurnEnded]: ((allegiance: BattleAllegiance) => void)[];
}

export interface BattleTemplateEnemy {
  chTemplate: CharacterTemplate;
  position: BattlePosition;
  ai?: BattleAI;
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
    onCharacterStaggered: [],
    onCharacterRecovered: [],
    onCharacterPinned: [],
    onCharacterSpell: [],
    onCharacterCasting: [],
    onCharacterAction: [],
    onCharacterInterrupted: [],
    onCharacterDefeated: [],
    onMagicShieldDamaged: [],
    onTurnStarted: [],
    onTurnEnded: [],
  };

  return {
    room,
    isCompleted: false,
    enemies,
    defeated: [] as BattleCharacter[],
    allies,
    subscriptions,
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
    STAGGER: 5,
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
    return BattleAllegiance.ALLY;
  }

  return null;
};
