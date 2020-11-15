import { Room, tilePosToWorldPoint } from 'model/room';
import {
  AnimationState,
  Character,
  characterSetAnimationState,
  CharacterTemplate,
  characterOnAnimationCompletion,
} from 'model/character';
import { Timer } from 'model/timer';
import { getFrameMultiplier } from 'model/misc';
import { Point } from 'utils';

export interface Battle {
  room: Room;
  allies: BattleCharacter[];
  enemies: BattleCharacter[];
}

export interface BattleCharacter {
  ch: Character;
  actionTimer: Timer;
  staggerTimer: Timer;
  staggerGauge: Gauge;
  position: BattlePosition;
  canAct: boolean;
  isActing: boolean;
  isStaggered: boolean;
  onCanActCb: () => void;
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

export class Gauge {
  max: number;
  current: number;
  decayRate: number;
  constructor(max: number, rate: number) {
    this.max = max;
    this.current = 0;
    this.decayRate = rate;
  }
  fill(x: number): void {
    this.current += x;
    if (this.current > this.max) {
      this.current = this.max;
    }
  }
  empty(): void {
    this.current = 0;
  }
  isFull(): boolean {
    return this.current >= this.max;
  }
  update(): void {
    this.current -= this.decayRate * getFrameMultiplier();
    if (this.current < 0) {
      this.current = 0;
    }
  }
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
    HP: 100,
    STAGGER: 0,
  };
};

export const battleCharacterCreateEnemy = (
  ch: Character,
  template: BattleTemplateEnemy
): BattleCharacter => {
  return {
    ch,
    actionTimer: new Timer(5000),
    staggerTimer: new Timer(2000),
    staggerGauge: new Gauge(11, 0.2),
    position: template.position,
    isActing: false,
    canAct: false,
    isStaggered: false,
    onCanActCb: function () {},
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
    actionTimer: new Timer(5000),
    staggerTimer: new Timer(1000),
    staggerGauge: new Gauge(11, 0.02),
    isActing: false,
    canAct: false,
    isStaggered: false,
    onCanActCb: function () {},
    position: args.position,
  };
};
export const battleCharacterSetStaggered = (bCh: BattleCharacter): void => {
  bCh.isStaggered = true;
  bCh.staggerTimer.start();
  bCh.staggerGauge.empty();
  characterSetAnimationState(bCh.ch, AnimationState.BATTLE_STAGGERED);
};
export const battleCharacterApplyDamage = (bCh: BattleCharacter): void => {
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

export const battleCharacterCanAct = (bCh: BattleCharacter): boolean => {
  if (bCh.isActing) {
    return false;
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

export const battleCharacterUpdate = (bCh: BattleCharacter): void => {
  if (bCh.isStaggered) {
    if (bCh.staggerTimer.isComplete()) {
      bCh.isStaggered = false;
      characterSetAnimationState(bCh.ch, AnimationState.BATTLE_IDLE);
    }
  }
  bCh.staggerGauge.update();

  if (!bCh.canAct) {
    if (battleCharacterCanAct(bCh)) {
      bCh.canAct = true;
      bCh.onCanActCb();
    }
  } else {
    bCh.canAct = battleCharacterCanAct(bCh);
  }
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

let currentBattle: null | Battle = ((window as any).battle = null);
export const getCurrentBattle = (): Battle => currentBattle as Battle;
export const setCurrentBattle = (b: Battle): void => {
  currentBattle = (window as any).battle = b;
};

export const battleUpdate = (battle: Battle): void => {
  battle.allies.concat(battle.enemies).forEach((bCh: BattleCharacter) => {
    battleCharacterUpdate(bCh);
  });
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
