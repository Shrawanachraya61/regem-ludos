import { Room, tilePosToWorldPoint } from 'model/room';
import { Character, CharacterTemplate } from 'model/character';
import { Timer } from 'model/timer';
import { Point } from 'utils';

export interface Battle {
  room: Room;
  allies: BattleCharacter[];
  enemies: BattleCharacter[];
}

interface BattleCharacter {
  ch: Character;
  actionTimer: Timer;
  position: BattlePosition;
  ai?: string;
}

export interface BattleTemplateEnemy {
  chTemplate: CharacterTemplate;
  position: BattlePosition;
  ai?: string;
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

export enum BattleAllegiance {
  ALLY = 'ally',
  ENEMY = 'enemy',
}

const BATTLE_ALLY_FRONT1: Point = [5, 7];
const BATTLE_ALLY_FRONT2: Point = [8, 10];
const BATTLE_ALLY_MIDDLE1: Point = [3, 9];
const BATTLE_ALLY_MIDDLE2: Point = [6, 12];
const BATTLE_ALLY_BACK1: Point = [1, 11];
const BATTLE_ALLY_BACK2: Point = [4, 14];
const BATTLE_ENEMY_FRONT1: Point = [7, 5];
const BATTLE_ENEMY_FRONT2: Point = [10, 8];
const BATTLE_ENEMY_MIDDLE1: Point = [9, 3];
const BATTLE_ENEMY_MIDDLE2: Point = [12, 6];
const BATTLE_ENEMY_BACK1: Point = [11, 1];
const BATTLE_ENEMY_BACK2: Point = [14, 4];
const BATTLE_POINTS_ALLY = {
  [BattlePosition.FRONT]: [BATTLE_ALLY_FRONT1, BATTLE_ALLY_FRONT2],
  [BattlePosition.MIDDLE]: [BATTLE_ALLY_MIDDLE1, BATTLE_ALLY_MIDDLE2],
  [BattlePosition.BACK]: [BATTLE_ALLY_BACK1, BATTLE_ALLY_BACK2],
};
const BATTLE_POINTS_ENEMY = {
  [BattlePosition.FRONT]: [BATTLE_ENEMY_FRONT1, BATTLE_ENEMY_FRONT2],
  [BattlePosition.MIDDLE]: [BATTLE_ENEMY_MIDDLE1, BATTLE_ENEMY_MIDDLE2],
  [BattlePosition.BACK]: [BATTLE_ENEMY_BACK1, BATTLE_ENEMY_BACK2],
};

export interface BattleStats {
  POW: number; // flat damage modifier
  ACC: number; // reduces variance that weapons have
  SPD: number; // how fast cooldown timer is
  FOR: number; // more of this reduces time spent staggered
  HP: number;
  STAGGER: number; // number of hits before stagger
}

export const battleStatsCreate = (): BattleStats => {
  return {
    POW: 1,
    ACC: 1,
    SPD: 1,
    FOR: 1,
    HP: 10,
    STAGGER: 0,
  };
};

export const battleCharacterCreateEnemy = (
  ch: Character,
  template: BattleTemplateEnemy
): BattleCharacter => {
  return {
    ch,
    actionTimer: new Timer(100),
    position: template.position,
    ai: template.ai,
  };
};
export const battleCharacterCreateAlly = (
  ch: Character,
  args: {
    position: BattlePosition;
  }
): BattleCharacter => {
  return {
    ch,
    actionTimer: new Timer(100),
    position: args.position,
  };
};

export const battleSetActorPositions = (battle: Battle): void => {
  const positionsAlly = {
    [BattlePosition.FRONT]: 0,
    [BattlePosition.MIDDLE]: 0,
    [BattlePosition.BACK]: 0,
  };
  const positionsEnemy = {
    [BattlePosition.FRONT]: 0,
    [BattlePosition.MIDDLE]: 0,
    [BattlePosition.BACK]: 0,
  };
  battle.allies.forEach((bCh: BattleCharacter) => {
    let pos = [0, 0];
    switch (bCh.position) {
      case BattlePosition.FRONT:
        pos =
          BATTLE_POINTS_ALLY[BattlePosition.FRONT][
            positionsAlly[BattlePosition.FRONT]++
          ];
        break;
      case BattlePosition.MIDDLE:
        pos =
          BATTLE_POINTS_ALLY[BattlePosition.MIDDLE][
            positionsAlly[BattlePosition.MIDDLE]++
          ];
        break;
      case BattlePosition.BACK:
        pos =
          BATTLE_POINTS_ALLY[BattlePosition.BACK][
            positionsAlly[BattlePosition.BACK]++
          ];
        break;
    }

    const [x, y] = tilePosToWorldPoint(pos[0], pos[1]);
    bCh.ch.x = x;
    bCh.ch.y = y;
  });
  battle.enemies.forEach((bCh: BattleCharacter) => {
    let pos = [0, 0];
    switch (bCh.position) {
      case BattlePosition.FRONT:
        pos =
          BATTLE_POINTS_ENEMY[BattlePosition.FRONT][
            positionsEnemy[BattlePosition.FRONT]++
          ];
        break;
      case BattlePosition.MIDDLE:
        pos =
          BATTLE_POINTS_ENEMY[BattlePosition.MIDDLE][
            positionsEnemy[BattlePosition.MIDDLE]++
          ];
        break;
      case BattlePosition.BACK:
        pos =
          BATTLE_POINTS_ENEMY[BattlePosition.BACK][
            positionsEnemy[BattlePosition.BACK]++
          ];
        break;
    }
    const [x, y] = tilePosToWorldPoint(pos[0], pos[1]);
    bCh.ch.x = x;
    bCh.ch.y = y;
  });
};

export const battleIsVictory = (battle: Battle): boolean => {
  for (let i = 0; i < battle.enemies.length; i++) {
    const ch = battle.enemies[i].ch;
    if (ch.hp > 0) {
      return false;
    }
  }
  return true;
};

let currentBattle: null | Battle = null;
export const getCurrentBattle = (): Battle => currentBattle as Battle;
export const setCurrentBattle = (b: Battle): void => {
  currentBattle = b;
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
