import {
  Battle,
  battleGetNearestAttackable,
  battleGetAllegiance,
} from 'model/battle';
import { BattleCharacter } from 'model/battle-character';
import { BattleActions } from 'controller/battle-actions';
import { invokeSkill } from './battle-management';

export type BattleAI = (battle: Battle, bCh: BattleCharacter) => void;

export const BATTLE_AI_ATTACK: BattleAI = (
  battle: Battle,
  bCh: BattleCharacter
): void => {
  const ch = bCh.ch;
  const allegiance = battleGetAllegiance(battle, ch);
  const target = battleGetNearestAttackable(battle, allegiance);
  if (target) {
    invokeSkill(bCh, bCh.ch.skills[0]);
  }
};
