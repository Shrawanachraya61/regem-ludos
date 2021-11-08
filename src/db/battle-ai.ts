import {
  Battle,
  battleGetTargetableCharacters,
  battleGetAllegiance,
} from 'model/battle';
import {
  BattleCharacter,
  battleCharacterGetSelectedSkill,
} from 'model/battle-character';
import { BattleActions } from 'controller/battle-actions';
import { invokeSkill } from 'controller/battle-management';
import { randInArr } from 'utils';

export type BattleAI = (battle: Battle, bCh: BattleCharacter) => void;

const exp = {} as { [key: string]: BattleAI };
export const get = (key: string): BattleAI => {
  const result = exp[key];
  if (!result) {
    throw new Error(`No battle-ai exists with name: ${key}`);
  }
  return result;
};

export const getIfExists = (key: string): BattleAI | null => {
  const result = exp[key];
  if (!result) {
    return null;
  }
  return result;
};

export const init = () => {
  exp.BATTLE_AI_ATTACK = (battle: Battle, bCh: BattleCharacter): void => {
    const ch = bCh.ch;
    const allegiance = battleGetAllegiance(battle, ch);
    const skill = battleCharacterGetSelectedSkill(bCh);
    const targets = battleGetTargetableCharacters(
      battle,
      allegiance,
      skill.type
    );
    const target = randInArr(targets);

    // const target = targets[0];
    console.log('BATTLE AI ATTACK', bCh, targets);
    if (target) {
      invokeSkill(bCh, skill);
    }
  };

  exp.BATTLE_AI_TUT_BOSS1 = (battle: Battle, bCh: BattleCharacter): void => {
    const ch = bCh.ch;
    const allegiance = battleGetAllegiance(battle, ch);

    // summon aid
    // only summon if robot is the only one left
    if (battle.enemies.length === 1) {
      const skill = bCh.ch.skills[3];
      bCh.ch.skillIndex = bCh.ch.skills.indexOf(skill);
      const targets = battleGetTargetableCharacters(
        battle,
        allegiance,
        skill.type
      );
      const target = randInArr(targets);
      if (target) {
        invokeSkill(bCh, skill);
      }
    } else {
      const skill = randInArr(bCh.ch.skills.slice(0, 3));
      bCh.ch.skillIndex = bCh.ch.skills.indexOf(skill);
      const targets = battleGetTargetableCharacters(
        battle,
        allegiance,
        skill.type
      );
      const target = randInArr(targets);
      if (target) {
        invokeSkill(bCh, skill);
      }
    }
  };
};

// export const BATTLE_AI_CHANNEL: BattleAI = (
//   battle: Battle,
//   bCh: BattleCharacter
// ): void => {
//   const ch = bCh.ch;
//   const allegiance = battleGetAllegiance(battle, ch);
//   const target = battleGetNearestAttackable(battle, allegiance);
//   if (target) {
//     invokeSkill(bCh, bCh.ch.skills[0]);
//   }
// };
