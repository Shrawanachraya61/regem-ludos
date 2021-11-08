import {
  Battle,
  battleStatsCreate,
  BattleStats,
  battleAddPersistentEffect,
  PersistentEffectEvent,
  BattleDamageType,
  battleRemovePersistentEffect,
  PersistentEffectEventParams,
  OnBeforeCharacterDamagedCb,
  BattleAllegiance,
  OnBeforeCharacterEvadesCb,
  BattlePosition,
  BattleTemplateEnemy,
  battleSetEnemyActorPosition,
} from 'model/battle';
import {
  AnimationState,
  Facing,
  CharacterTemplate,
  characterCreateFromTemplate,
  characterGetPosCenterPx,
} from 'model/character';
import {
  BattleAction,
  SwingType,
  BattleActionType,
  doSwing,
  getTarget,
  doRange,
  RangeType,
  doSpell,
  doChannel,
} from 'controller/battle-actions';
import { resetCooldownTimer, setCasting } from 'controller/battle-management';
import {
  BattleCharacter,
  battleCharacterCreateEnemy,
} from 'model/battle-character';
import {
  EFFECT_TEMPLATE_FIREBALL,
  particleCreateFromTemplate,
} from 'model/particle';
import { createAnimation } from 'model/animation';
import { get as getParticle } from 'db/particles';
import { getCurrentBattle, getCurrentRoom } from 'model/generics';

import { get as getEnemy } from 'db/enemies';
import { varyStats } from 'utils';
import { roomAddCharacter, roomAddParticle } from 'model/room';
import { playSoundName } from 'model/sound';
import { renderUi } from 'view/ui';

const COOLDOWN_MOD = 1.5;

// const COOLDOWN_MOD = 0.25;

export const initBattleActions = (): Record<string, BattleAction> => {
  const exp = {
    RobotSwingNormalNNStaggerable: {
      name: 'RobotSwingNormalNNStaggerable',
      label: 'Robot',
      description: 'AI',
      cooldown: 10000 * COOLDOWN_MOD,
      type: BattleActionType.SWING,
      meta: {
        swings: [SwingType.NORMAL, SwingType.NORMAL],
      },
      cb: async function (battle: Battle, bCh: BattleCharacter): Promise<void> {
        const baseDamage = 1;
        const baseStagger = 5;
        const target = getTarget(battle, bCh);
        if (target) {
          await doSwing(battle, this, bCh, target, {
            baseDamage,
            baseStagger,
            swingType:
              this.meta?.swings?.[bCh.actionStateIndex] ?? SwingType.NORMAL,
          });
        }
      },
    },
    RobotSwingNormalNN: {
      name: 'RobotSwingNormalNN',
      label: 'Robot',
      description: 'AI',
      cooldown: 10000 * COOLDOWN_MOD,
      type: BattleActionType.SWING,
      meta: {
        swings: [SwingType.NORMAL, SwingType.NORMAL],
      },
      cb: async function (battle: Battle, bCh: BattleCharacter): Promise<void> {
        const baseDamage = 1;
        const baseStagger = 5;
        const target = getTarget(battle, bCh);
        if (target) {
          await doSwing(battle, this, bCh, target, {
            baseDamage,
            baseStagger,
            swingType:
              this.meta?.swings?.[bCh.actionStateIndex] ?? SwingType.NORMAL,
          });
        }
      },
    },
    RobotSwingSpeedyN: {
      name: 'RobotSwingSpeedyN',
      label: 'Robot',
      description: 'AI',
      cooldown: 4000 * COOLDOWN_MOD,
      type: BattleActionType.SWING,
      meta: {
        swings: [SwingType.NORMAL, SwingType.NORMAL],
      },
      cb: async function (battle: Battle, bCh: BattleCharacter): Promise<void> {
        const baseDamage = 1;
        const baseStagger = 5;
        const target = getTarget(battle, bCh);
        if (target) {
          await doSwing(battle, this, bCh, target, {
            baseDamage,
            baseStagger,
            swingType:
              this.meta?.swings?.[bCh.actionStateIndex] ?? SwingType.NORMAL,
          });
        }
      },
    },
    RobotSwingArmoredNK: {
      name: 'RobotSwingArmoredNK',
      description: 'AI',
      cooldown: 11000 * COOLDOWN_MOD,
      type: BattleActionType.SWING,
      meta: {
        swings: [SwingType.NORMAL, SwingType.KNOCK_DOWN],
      },
      cb: async function (battle: Battle, bCh: BattleCharacter): Promise<void> {
        const baseDamage = 3;
        const baseStagger = 1;
        const target = getTarget(battle, bCh);
        if (target) {
          await doSwing(battle, this, bCh, target, {
            baseDamage,
            baseStagger,
            swingType:
              this.meta?.swings?.[bCh.actionStateIndex] ?? SwingType.NORMAL,
          });
        }
      },
    },
    RobotSwingPierce: {
      name: 'RobotSwingPierce',
      description: 'AI',
      cooldown: 9000 * COOLDOWN_MOD,
      type: BattleActionType.SWING,
      meta: {
        swings: [SwingType.PIERCE],
      },
      cb: async function (battle: Battle, bCh: BattleCharacter): Promise<void> {
        const baseDamage = 1;
        const baseStagger = 5;
        const target = getTarget(battle, bCh);
        if (target) {
          await doSwing(battle, this, bCh, target, {
            baseDamage,
            baseStagger,
            swingType:
              this.meta?.swings?.[bCh.actionStateIndex] ?? SwingType.NORMAL,
          });
        }
      },
    },
    RobotRanged: {
      name: 'RobotRanged',
      description: 'AI',
      cooldown: 5000 * COOLDOWN_MOD,
      type: BattleActionType.RANGED,
      meta: {
        ranges: [RangeType.NORMAL, RangeType.NORMAL],
      },
      cb: async function (battle: Battle, bCh: BattleCharacter): Promise<void> {
        const baseDamage = 1;
        const baseStagger = 0;
        const target = getTarget(battle, bCh);
        if (target) {
          await doRange(battle, this, bCh, target, {
            baseDamage,
            baseStagger,
            rangeType:
              this.meta?.ranges?.[bCh.actionStateIndex] ?? RangeType.NORMAL,
          });
        }
      },
    },
    RobotBlackFireSnap: {
      name: 'RobotBlackFireSnap',
      description: 'AI',
      cooldown: 5500 * COOLDOWN_MOD,
      type: BattleActionType.CAST,
      meta: {
        castTime: 3000,
        // icon: SwordIcon,
      },
      cb: async function (battle: Battle, bCh: BattleCharacter): Promise<void> {
        const baseDamage = 5;
        const baseStagger = 99;
        const target = getTarget(battle, bCh);
        if (target) {
          setCasting(bCh, {
            castTime: exp.RobotBlackFireSnap.meta.castTime as number,
            onCast: async () => {
              const target = getTarget(battle, bCh);
              if (target) {
                await doSpell(battle, exp.RobotBlackFireSnap, bCh, [target], {
                  baseDamage,
                  baseStagger,
                  particleText: 'Black Fire Snap!',
                  particleTemplate: EFFECT_TEMPLATE_FIREBALL,
                  soundName: 'battle_fire_explosion1',
                });
              }
            },
            onInterrupt: async () => {},
          });
        }
      },
    },
    RobotChannelEvasionBuff: {
      name: 'RobotChannelEvasionBuff',
      description: 'AI',
      cooldown: 20000 * COOLDOWN_MOD,
      type: BattleActionType.CHANNEL,
      meta: {},
      cb: async function (battle: Battle, bCh: BattleCharacter): Promise<void> {
        const persistentEffectCb: OnBeforeCharacterEvadesCb = (
          bCh: BattleCharacter,
          currentEvasion: number,
          damageType: BattleDamageType
        ) => {
          console.log(
            'GOT A EVASION TYPE IN PERSISTENT EFFECT CB',
            bCh,
            currentEvasion,
            damageType
          );
          return currentEvasion + 10;
        };
        const persistentEffect: PersistentEffectEventParams<OnBeforeCharacterEvadesCb> = {
          cb: persistentEffectCb,
          source: bCh,
          affectedAllegiance: BattleAllegiance.ENEMY,
          name: 'Evasion+',
          description: 'Units have 10% increased evasion.',
          icon: 'effects_channel_buff',
          anim: createAnimation('effects_channel_buff2'),
        };
        battleAddPersistentEffect(
          battle,
          PersistentEffectEvent.onBeforeCharacterEvades,
          persistentEffect
        );
        bCh.onChannelInterrupted = async () => {
          battleRemovePersistentEffect(
            battle,
            PersistentEffectEvent.onBeforeCharacterEvades,
            persistentEffect
          );
        };
        await doChannel(battle, exp.RobotChannelEvasionBuff, bCh, {
          particleText: 'Evasion+',
          soundName: 'robot_channel_start',
        });
      },
    },

    // BOSS ----------------------------------------------------------------------------------

    BossRobotSwingArmoredN: {
      name: 'BossRobotSwingArmoredNK',
      description: 'AI',
      cooldown: 6000 * COOLDOWN_MOD,
      type: BattleActionType.SWING,
      meta: {
        swings: [SwingType.NORMAL, SwingType.NORMAL],
      },
      cb: async function (battle: Battle, bCh: BattleCharacter): Promise<void> {
        const baseDamage = 5;
        const baseStagger = 3;
        const target = getTarget(battle, bCh);
        if (target) {
          await doSwing(battle, this, bCh, target, {
            baseDamage,
            baseStagger,
            swingType:
              this.meta?.swings?.[bCh.actionStateIndex] ?? SwingType.NORMAL,
          });
        }
      },
    },
    BossRobotSwingArmoredNK: {
      name: 'BossRobotSwingArmoredNK',
      description: 'AI',
      cooldown: 6000 * COOLDOWN_MOD,
      type: BattleActionType.SWING,
      meta: {
        swings: [SwingType.KNOCK_DOWN],
      },
      cb: async function (battle: Battle, bCh: BattleCharacter): Promise<void> {
        const baseDamage = 5;
        const baseStagger = 3;
        const target = getTarget(battle, bCh);
        if (target) {
          await doSwing(battle, this, bCh, target, {
            baseDamage,
            baseStagger,
            swingType:
              this.meta?.swings?.[bCh.actionStateIndex] ?? SwingType.NORMAL,
          });
        }
      },
    },
    BossRobotSwingPierce: {
      name: 'BossRobotSwingPierce',
      description: 'AI',
      cooldown: 7000 * COOLDOWN_MOD,
      type: BattleActionType.SWING,
      meta: {
        swings: [SwingType.PIERCE],
      },
      cb: async function (battle: Battle, bCh: BattleCharacter): Promise<void> {
        const baseDamage = 1;
        const baseStagger = 5;
        const target = getTarget(battle, bCh);
        if (target) {
          await doSwing(battle, this, bCh, target, {
            baseDamage,
            baseStagger,
            swingType:
              this.meta?.swings?.[bCh.actionStateIndex] ?? SwingType.NORMAL,
          });
        }
      },
    },
    BossRobotSummonAid: {
      name: 'BossRobotSummonAid',
      description: 'AI',
      cooldown: 7000 * COOLDOWN_MOD,
      type: BattleActionType.CAST,
      meta: {
        castTime: 1000,
        // icon: SwordIcon,
      },
      cb: async function (battle: Battle, bCh: BattleCharacter): Promise<void> {
        const target = getTarget(battle, bCh);
        if (target) {
          setCasting(bCh, {
            castTime: exp.BossRobotSummonAid.meta.castTime as number,
            onCast: async () => {
              await doSpell(battle, exp.BossRobotSummonAid, bCh, [], {
                baseDamage: undefined,
                baseStagger: undefined,
                particleText: 'Summon Aid!',
                particleTemplate: getParticle('EFFECT_TEMPLATE_PORTAL_SPAWN'),
                soundName: 'battle_fire_explosion1',
                cb: () => {
                  const room = getCurrentRoom();
                  const battle = getCurrentBattle();
                  const enemyTemplates = [
                    {
                      chTemplate: getEnemy('TUT_ROBOT_MELEE'),
                      position: BattlePosition.FRONT,
                      ai: 'BATTLE_AI_ATTACK',
                    },
                    {
                      chTemplate: varyStats(getEnemy('TUT_ROBOT_MAGE')),
                      position: BattlePosition.MIDDLE,
                      ai: 'BATTLE_AI_ATTACK',
                    },
                  ];

                  const enemies = enemyTemplates.map(
                    (t: BattleTemplateEnemy) => {
                      const ch = characterCreateFromTemplate(t.chTemplate);
                      roomAddCharacter(room, ch);
                      return battleCharacterCreateEnemy(ch, t);
                    }
                  );

                  playSoundName('battle_fire_explosion1');
                  enemies.forEach(bCh => {
                    battle.enemies.push(bCh);
                    battle.enemiesStorage.push(bCh);
                    resetCooldownTimer(bCh);
                    battleSetEnemyActorPosition(battle, bCh);

                    const [targetPx, targetPy] = characterGetPosCenterPx(
                      bCh.ch
                    );
                    const particleTemplate = getParticle(
                      'EFFECT_TEMPLATE_PORTAL_SPAWN'
                    );

                    roomAddParticle(
                      battle.room,
                      particleCreateFromTemplate(
                        [targetPx, targetPy],
                        particleTemplate
                      )
                    );
                  });

                  // lol, need to render the character followers and info cards
                  renderUi();
                },
              });
            },
            onInterrupt: async () => {},
          });
        }
      },
    },
  };
  return exp;
};

export const init = (exp: { [key: string]: CharacterTemplate }) => {
  const BattleActions = initBattleActions();

  exp.TUT_ROBOT_MELEE_REALLY_EASY = {
    name: 'Robot M',
    spriteBase: 'tut_robot_melee',
    stats: {
      ...battleStatsCreate(),
      HP: 1,
      STAGGER: 5,
    },
    facing: Facing.LEFT,
    animationState: AnimationState.BATTLE_IDLE,
    skills: [BattleActions.RobotSwingNormalNNStaggerable],
    armor: 0,
    staggerSoundName: 'robot_staggered',
  };

  exp.TUT_ROBOT_MELEE_EASY = {
    name: 'Robot M',
    spriteBase: 'tut_robot_melee',
    stats: {
      ...battleStatsCreate(),
      HP: 15,
      STAGGER: 15,
    },
    facing: Facing.LEFT,
    animationState: AnimationState.BATTLE_IDLE,
    skills: [BattleActions.RobotSwingNormalNNStaggerable],
    armor: 0,
    staggerSoundName: 'robot_staggered',
  };

  exp.TUT_ROBOT_MELEE_STAGGERABLE = {
    name: 'Robot M',
    spriteBase: 'tut_robot_melee',
    stats: {
      ...battleStatsCreate(),
      HP: 25,
      STAGGER: 1,
    },
    facing: Facing.LEFT,
    animationState: AnimationState.BATTLE_IDLE,
    skills: [BattleActions.RobotSwingNormalNNStaggerable],
    armor: 0,
    staggerSoundName: 'robot_staggered',
  };

  exp.TUT_ROBOT_MELEE = {
    name: 'Robot M',
    spriteBase: 'tut_robot_melee',
    stats: {
      ...battleStatsCreate(),
      HP: 25,
      POW: 5,
      STAGGER: 5,
    },
    facing: Facing.LEFT,
    animationState: AnimationState.BATTLE_IDLE,
    skills: [BattleActions.RobotSwingNormalNN],
    armor: 0,
    staggerSoundName: 'robot_staggered',
  };

  exp.TUT_ROBOT_MELEE_SPEEDY = {
    name: 'Robot M Fast',
    spriteBase: 'tut_robot_melee_speedy',
    stats: {
      ...battleStatsCreate(),
      HP: 20,
      POW: 3,
      STAGGER: 3,
    },
    facing: Facing.LEFT,
    animationState: AnimationState.BATTLE_IDLE,
    skills: [BattleActions.RobotSwingSpeedyN],
    armor: 0,
    staggerSoundName: 'robot_staggered',
  };

  exp.TUT_ROBOT_ARMORED = {
    name: 'Robot Armored',
    spriteBase: 'tut_robot_armored',
    spriteSize: [40, 40],
    stats: {
      ...battleStatsCreate(),
      HP: 28,
      POW: 6,
      STAGGER: 12,
    },
    facing: Facing.LEFT,
    animationState: AnimationState.BATTLE_IDLE,
    skills: [BattleActions.RobotSwingArmoredNK, BattleActions.RobotSwingPierce],
    armor: 1,
    staggerSoundName: 'robot_staggered',
  };

  exp.TUT_ROBOT_RANGED = {
    name: 'Robot R',
    spriteBase: 'tut_robot_ranged',
    stats: {
      ...battleStatsCreate(),
      HP: 20,
      POW: 3,
      STAGGER: 5,
    },
    facing: Facing.LEFT,
    animationState: AnimationState.BATTLE_IDLE,
    skills: [BattleActions.RobotRanged],
    armor: 0,
    staggerSoundName: 'robot_staggered',
  };

  exp.TUT_ROBOT_MAGE = {
    name: 'Robot Mage',
    spriteBase: 'tut_robot_mage',
    stats: {
      ...battleStatsCreate(),
      HP: 18,
      POW: 6,
      STAGGER: 5,
    },
    facing: Facing.LEFT,
    animationState: AnimationState.BATTLE_IDLE,
    skills: [BattleActions.RobotBlackFireSnap],
    armor: 0,
    staggerSoundName: 'robot_staggered',
  };

  exp.TUT_ROBOT_CHANNELER = {
    name: 'Robot Chnl',
    spriteBase: 'tut_robot_channeler',
    stats: {
      ...battleStatsCreate(),
      HP: 18,
      STAGGER: 5,
    },
    facing: Facing.LEFT,
    animationState: AnimationState.BATTLE_IDLE,
    skills: [BattleActions.RobotChannelEvasionBuff],
    armor: 0,
    staggerSoundName: 'robot_staggered',
  };

  exp.TUT_ROBOT_BOSS = {
    name: 'Big Robot!',
    spriteBase: 'tut_robot_boss',
    spriteSize: [96, 96],
    followerSize: [64, 64],
    sortOffset: 32,
    stats: {
      ...battleStatsCreate(),
      HP: 100,
      STAGGER: 25,
    },
    facing: Facing.LEFT,
    animationState: AnimationState.BATTLE_IDLE,
    skills: [
      BattleActions.BossRobotSwingArmoredN,
      BattleActions.BossRobotSwingArmoredNK,
      BattleActions.BossRobotSwingPierce,
      BattleActions.BossRobotSummonAid,
    ],
    armor: 1,
    hiddenHP: true,
    staggerSoundName: 'robot_staggered',
  };
};
