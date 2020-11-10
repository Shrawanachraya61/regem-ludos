import { Room } from 'model/room';
import { Character, CharacterTemplate } from 'model/character';
import { Timer } from 'model/timer';

export enum BattlePosition {
  FRONT = 'front',
  MIDDLE = 'middle',
  BACK = 'back',
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
    POW: 1,
    ACC: 1,
    SPD: 1,
    FOR: 1,
    HP: 10,
    STAGGER: 0,
  };
};

export interface BattleTemplateEnemy {
  chTemplate: CharacterTemplate;
  position: BattlePosition;
  ai: string;
}

export interface BattleTemplate {
  roomName: string;
  enemies: BattleTemplateEnemy[];
}

interface BattleCharacter {
  ch: Character;
  actionTimer: Timer;
  position: BattlePosition;
  ai?: string;
}
export const battleCharacterCreate = (
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

export interface Battle {
  room: Room;
  allies: BattleCharacter[];
  enemies: BattleCharacter[];
}

export const battleSetActorPositions = (battle: Battle): void => {
  battle.allies.forEach((bCh: BattleCharacter) => {
    bCh.ch.x = 0;
    bCh.ch.y = 0;
  });
  battle.enemies.forEach((bCh: BattleCharacter) => {
    bCh.ch.x = 0;
    bCh.ch.y = 0;
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
