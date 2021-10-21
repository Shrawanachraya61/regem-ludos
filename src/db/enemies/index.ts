import { battleStatsCreate, BattleStats } from 'model/battle';
import { AnimationState, Facing, CharacterTemplate } from 'model/character';
import { BattleActions } from 'controller/battle-actions';

import { init as initTutorial } from './tutorial-enemies';

const exp = {} as { [key: string]: CharacterTemplate };
export const get = (key: string): CharacterTemplate => {
  const result = exp[key];
  if (!result) {
    throw new Error(`No enemy template exists with name: ${key}`);
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
    spriteBase: 'guy-battle',
    stats: {
      ...battleStatsCreate(),
      HP: 100,
      STAGGER: 10,
    },
    facing: Facing.LEFT,
    animationState: AnimationState.BATTLE_IDLE,
    skills: [BattleActions.Swing, BattleActions.Swing],
    armor: 1,
  };

  exp.ENEMY_GUY_IMPOSSIBLE = {
    name: 'guy',
    spriteBase: 'guy-battle',
    stats: {
      ...battleStatsCreate(),
      HP: 1000,
      STAGGER: 100,
    },
    facing: Facing.LEFT,
    animationState: AnimationState.BATTLE_IDLE,
    skills: [BattleActions.SwingKO],
    armor: 99,
  };

  initTutorial(exp);

  (window as any).enemies = exp;

  for (const i in exp) {
    const enemyTemplate = exp[i];
    for (const j in enemyTemplate.skills) {
      const skill = enemyTemplate.skills[j];
      if (!skill) {
        throw new Error(
          `Enemy template '${enemyTemplate.name}' has invalid skill at index: ${j}`
        );
      }
    }
  }
};
