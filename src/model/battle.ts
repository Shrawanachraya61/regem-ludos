import { Room } from 'model/room';
import { BattleAI } from 'controller/battle-ai';
import { BattleCharacter } from './battle-character';
import { CharacterTemplate, Character } from './character';
import { setAtMarker } from 'controller/scene-commands';
import { getCurrentPlayer } from './generics';

export interface Battle {
  room: Room;
  isCompleted: boolean;
  allies: BattleCharacter[];
  enemies: BattleCharacter[];
  defeated: BattleCharacter[];
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
  CON: number;
  RES: number;
  SPD: number;
  FOR: number;
  HP: number;
  STAGGER: number; // stagger hp
}

export const battleCreate = (
  room: Room,
  allies: BattleCharacter[],
  enemies: BattleCharacter[]
): Battle => {
  return {
    room,
    isCompleted: false,
    enemies,
    defeated: [] as BattleCharacter[],
    allies,
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
