import { Room, tilePosToWorldPos } from 'model/room';
import {
  AnimationState,
  Character,
  characterSetAnimationState,
  CharacterTemplate,
  characterOnAnimationCompletion,
  characterModifyHp,
} from 'model/character';
import { Point } from 'utils';
import { BattleAI } from 'controller/battle-ai';
import { BattleAction } from 'controller/battle-actions';
import {
  calculateStaggerDamage,
  completeCast,
} from 'controller/battle-management';
import { Timer, Gauge } from 'model/utility';

export interface Battle {
  room: Room;
  isCompleted: boolean;
  allies: BattleCharacter[];
  enemies: BattleCharacter[];
  defeated: BattleCharacter[];
}

export interface BattleCharacter {
  ch: Character;
  isDefeated: boolean;
  shouldRemove: boolean;
  actionTimer: Timer;
  staggerTimer: Timer;
  staggerGauge: Gauge;
  castTimer: Timer;
  position: BattlePosition;
  canAct: boolean;
  isActing: boolean;
  isCasting: boolean;
  isStaggered: boolean;
  statuses: Status[];
  onCanActCb: () => void;
  onCast: () => void;
  onCastInterrupted: () => void;
  row: BattleRow;
  ai?: BattleAI;
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
  POW: number; // flat damage modifier
  ACC: number; // reduces variance that weapons have
  SPD: number; // how fast cooldown timer is
  FOR: number; // more of this reduces time spent staggered
  HP: number;
  STAGGER: number; // number of hits before stagger
}

export const battleStatsCreate = (): BattleStats => {
  return {
    POW: 5,
    ACC: 1,
    SPD: 1,
    FOR: 1,
    HP: 1,
    STAGGER: 2,
  };
};

const battleCharacterCreate = (
  ch: Character,
  position: BattlePosition,
  ai?: any
): BattleCharacter => {
  const skill = ch.skills[ch.skillIndex];
  const staggerDmg = calculateStaggerDamage(ch);
  return {
    ch,
    isDefeated: false,
    shouldRemove: false,
    actionTimer: new Timer(skill?.cooldown ?? 2000),
    staggerTimer: new Timer(1000),
    staggerGauge: new Gauge(staggerDmg, 0.02),
    castTimer: new Timer(1000),
    position: position,
    isActing: false,
    isCasting: false,
    canAct: false,
    isStaggered: false,
    statuses: [] as Status[],
    row: BattleRow.NONE,
    onCanActCb: function () {},
    onCast: function () {},
    onCastInterrupted: function () {},
    ai,
  };
};

export const battleCharacterCreateEnemy = (
  ch: Character,
  template: BattleTemplateEnemy
): BattleCharacter => {
  return battleCharacterCreate(ch, template.position, template.ai);
};
export const battleCharacterCreateAlly = (
  ch: Character,
  args: {
    position: BattlePosition;
  }
): BattleCharacter => {
  return battleCharacterCreate(ch, args.position);
};
export const battleCharacterSetStaggered = (bCh: BattleCharacter): void => {
  bCh.isStaggered = true;
  bCh.staggerTimer.start();
  bCh.staggerGauge.empty();
  characterSetAnimationState(bCh.ch, AnimationState.BATTLE_STAGGERED);
};
export const battleCharacterApplyDamage = (
  bCh: BattleCharacter,
  dmg: number
): void => {
  characterModifyHp(bCh.ch, -dmg);
  if (bCh.isStaggered) {
    characterSetAnimationState(bCh.ch, AnimationState.BATTLE_STAGGERED);
  } else {
    characterSetAnimationState(bCh.ch, AnimationState.BATTLE_DAMAGED);
    characterOnAnimationCompletion(bCh.ch, () => {
      if (bCh.isStaggered) {
        characterSetAnimationState(bCh.ch, AnimationState.BATTLE_STAGGERED);
      } else {
        characterSetAnimationState(bCh.ch, AnimationState.BATTLE_IDLE);
      }
    });
  }
};

export const battleCharacterCanAct = (
  battle: Battle,
  bCh: BattleCharacter
): boolean => {
  if (bCh.isActing) {
    return false;
  }
  const ch = bCh.ch;
  const allegiance = battleGetAllegiance(battle, ch);
  const opposingBattleCharacters =
    allegiance === BattleAllegiance.ALLY ? battle.enemies : battle.allies;
  for (let i = 0; i < opposingBattleCharacters.length; i++) {
    const bc = opposingBattleCharacters[i];
    if (bc.isActing) {
      return false;
    }
  }
  return bCh.actionTimer.isComplete();
};

export const battleCharacterSetCanActCb = (
  bCh: BattleCharacter,
  cb: () => void
): void => {
  bCh.onCanActCb = cb;
};
export const battleCharacterRemoveCanActCb = (bCh: BattleCharacter): void => {
  bCh.onCanActCb = function () {};
};

export const battleCharacterAddStatus = (
  bCh: BattleCharacter,
  status: Status
) => {
  if (!bCh.statuses.includes(status)) {
    bCh.statuses.push(status);
  }
};

export const battleCharacterRemoveStatus = (
  bCh: BattleCharacter,
  status: Status
) => {
  const ind = bCh.statuses.indexOf(status);
  if (ind > -1) {
    bCh.statuses.splice(ind, 1);
  }
};

export const battleCharacterGetSelectedSkill = (
  bCh: BattleCharacter
): BattleAction => {
  const skill = bCh.ch.skills[bCh.ch.skillIndex];
  return skill;
};

export const battleCharacterGetRow = (bCh: BattleCharacter): BattleRow => {
  return bCh.row;
};

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

  const createPosSetter = (positionsAllegiance: any, battlePoints: any) => (
    bCh: BattleCharacter
  ) => {
    let pos = [0, 0];
    let rowNumber = 0;
    switch (bCh.position) {
      case BattlePosition.FRONT:
        rowNumber = positionsAllegiance[BattlePosition.FRONT];
        pos =
          battlePoints[BattlePosition.FRONT][
            positionsAllegiance[BattlePosition.FRONT]++
          ];
        break;
      case BattlePosition.MIDDLE:
        rowNumber = positionsAllegiance[BattlePosition.MIDDLE];
        pos =
          battlePoints[BattlePosition.MIDDLE][
            positionsAllegiance[BattlePosition.MIDDLE]++
          ];
        break;
      case BattlePosition.BACK:
        rowNumber = positionsAllegiance[BattlePosition.BACK];
        pos =
          battlePoints[BattlePosition.BACK][
            positionsAllegiance[BattlePosition.BACK]++
          ];
        break;
    }

    const [x, y] = tilePosToWorldPos(pos[0], pos[1]);
    if (rowNumber <= 1) {
      bCh.row = rowNumber === 0 ? BattleRow.TOP : BattleRow.BOTTOM;
      bCh.ch.x = x;
      bCh.ch.y = y;
    } else {
      console.error(
        'Error setting actor position for battle, Row number is greater than 1 (most likely more than 2 actors in a battle position)',
        bCh
      );
    }
  };

  battle.allies.forEach(createPosSetter(positionsAlly, BATTLE_POINTS_ALLY));
  battle.enemies.forEach(createPosSetter(positionsEnemy, BATTLE_POINTS_ENEMY));
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
