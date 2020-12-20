import { battleStatsCreate, BattleStats } from 'model/battle';
import { AnimationState, Facing, CharacterTemplate } from 'model/character';
import { BattleActions } from 'controller/battle-actions';

const exp = {} as { [key: string]: CharacterTemplate };
export const get = (key: string): CharacterTemplate => {
  const result = exp[key];
  if (!result) {
    throw new Error(`No enemy exists with name: ${key}`);
  }
  return {
    ...result,
    stats: {
      ...result.stats,
    } as BattleStats,
  };
};

export const init = () => {
  exp.ENEMY_GUY = {
    name: 'guy',
    spriteBase: 'guy',
    stats: battleStatsCreate(),
    facing: Facing.LEFT,
    animationState: AnimationState.BATTLE_IDLE,
    skills: [BattleActions.SwingSlow],
  };
};
