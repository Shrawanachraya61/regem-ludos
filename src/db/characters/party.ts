import {
  BattleAction,
  SwingType,
  BattleActionType,
  doSwing,
  getTarget,
  RangeType,
  doRange,
  doSpell,
} from 'controller/battle-actions';
import {
  Battle,
  battleGetTargetedEnemy,
  battleStatsCreate,
} from 'model/battle';
import { BattleCharacter } from 'model/battle-character';
import SwordIcon from 'view/icons/Sword';
import {
  AnimationState,
  Facing,
  CharacterTemplate,
  WeaponEquipState,
} from 'model/character';
import {
  beginAction,
  endAction,
  setCasting,
} from 'controller/battle-management';
import { EFFECT_TEMPLATE_FIREBALL } from 'model/particle';
import { WeaponType } from 'db/items';

export const init = () => {
  const exp = {} as { [key: string]: CharacterTemplate };

  exp.Ada = {
    name: 'Ada',
    fullName: 'Adalais Eldridge',
    spriteBase: 'ada',
    staggerSoundName: 'battle_staggered1',
    stats: {
      ...battleStatsCreate(),
      HP: 50,
    },
    facing: Facing.DOWN,
    animationState: AnimationState.IDLE,
    weaponEquipTypes: [WeaponType.SWORD],
    speed: 1.5,
  };

  exp.Conscience = {
    name: 'Conscience',
    fullName: '<Unknown Entity>',
    spriteBase: 'conscience',
    talkTrigger: '',
    staggerSoundName: 'battle_staggered1',
    facing: Facing.DOWN,
    animationState: AnimationState.IDLE,
    weaponEquipState: WeaponEquipState.RANGED,
    weaponEquipTypes: [WeaponType.BOW, WeaponType.WAND],
    stats: {
      ...battleStatsCreate(),
      HP: 45,
    },
    speed: 1.5,
  };

  exp.Skye = {
    name: 'Skye',
    fullName: 'Skye Salsbeck',
    spriteBase: 'skye',
    talkTrigger: '',
    staggerSoundName: 'battle_staggered1',
    facing: Facing.LEFT_UP,
    animationState: AnimationState.IDLE,
    weaponEquipTypes: [WeaponType.HAMMER],
    speed: 1.5,
    stats: {
      ...battleStatsCreate(),
      HP: 55,
    },
  };

  exp.Anjana = {
    name: 'Anjana',
    fullName: 'Anjana Lal',
    spriteBase: 'skye',
    talkTrigger: '',
    staggerSoundName: 'battle_staggered1',
    facing: Facing.LEFT_UP,
    animationState: AnimationState.IDLE,
    weaponEquipTypes: [WeaponType.WAND],
    speed: 1.5,
    stats: {
      ...battleStatsCreate(),
      HP: 40,
    },
  };

  exp.Vivi = {
    name: 'Vivi',
    fullName: 'Vivianna Mills',
    spriteBase: 'skye',
    talkTrigger: '',
    staggerSoundName: 'battle_staggered1',
    facing: Facing.LEFT_UP,
    animationState: AnimationState.IDLE,
    weaponEquipTypes: [WeaponType.WAND],
    speed: 1.5,
    stats: {
      ...battleStatsCreate(),
      HP: 40,
    },
  };

  exp.Iroha = {
    name: 'Iroha',
    fullName: 'Iroha Shimomura',
    spriteBase: 'skye',
    talkTrigger: '',
    staggerSoundName: 'battle_staggered1',
    facing: Facing.LEFT_UP,
    animationState: AnimationState.IDLE,
    weaponEquipTypes: [WeaponType.WAND],
    speed: 1.5,
    stats: {
      ...battleStatsCreate(),
      HP: 40,
    },
  };

  return exp;
};
