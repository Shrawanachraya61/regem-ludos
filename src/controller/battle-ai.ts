import {
  Battle,
  BattleCharacter,
  battleGetAllegiance,
  battleGetNearestAttackable,
} from 'model/battle';
import { attack } from 'controller/battle-management';

export type BattleAI = (battle: Battle, bCh: BattleCharacter) => void;

export const BATTLE_AI_ATTACK: BattleAI = (
  battle: Battle,
  bCh: BattleCharacter
): void => {
  const ch = bCh.ch;
  const allegiance = battleGetAllegiance(battle, ch);
  const target = battleGetNearestAttackable(battle, allegiance);
  if (target) {
    attack(battle, bCh);
  }
};
