import { Room, roomRemoveCharacter, tilePosToWorldPos } from 'model/room';
import {
  AnimationState,
  Character,
  characterSetAnimationState,
  characterGetAnimationState,
  CharacterTemplate,
  characterOnAnimationCompletion,
  characterModifyHp,
  characterHasAnimationState,
  WeaponEquipState,
  characterGetStatModifier,
} from 'model/character';
import { Point, randomId, timeoutPromise } from 'utils';
import { BattleAI, get as getBattleAi } from 'db/battle-ai';
import {
  BattleAction,
  BattleActionType,
  SwingType,
} from 'controller/battle-actions';
import { completeCast, endAction } from 'controller/battle-management';
import { Timer, Gauge } from 'model/utility';
import {
  Battle,
  BattlePosition,
  BattleStatus,
  BattleTemplateEnemy,
  BattleAllegiance,
  battleGetCharactersOfAllegiance,
  battleGetOppositeAllegiance,
  battleGetAllegiance,
  battleInvokeEvent,
  BattleEvent,
  battleSubscribeEvent,
  battleUnsubscribeEvent,
} from './battle';
import { playSoundName } from './sound';
import { getNow } from './generics';
import { get as getBattleAction } from 'db/battle-actions';
import { getIfExists as getCharacterTemplate } from 'db/characters';

export enum BattleActionState {
  IDLE = 'idle',
  ACTING = 'acting',
  ACTING_READY = 'acting-ready',
  CASTING = 'casting',
  CHANNELING = 'channeling',
  STAGGERED = 'staggered',
  KNOCKED_DOWN = 'knocked-down',
}

export interface BattleCharacter {
  ch: Character;
  armor: number;
  isDefeated: boolean;
  shouldRemove: boolean;
  actionTimer: Timer; // cooldown timer
  actionReadyTimer: Timer; // timer for how long to wait while in the actionReady state
  staggerTimer: Timer;
  staggerGauge: Gauge;
  koTimer: Timer;
  castTimer: Timer;
  armorTimer: Timer; // timer for tracking simultaneous hits that break armor
  position: BattlePosition;
  positionMarker: number;
  actionState: BattleActionState;
  actionStateIndex: number;
  statuses: {
    status: BattleStatus;
    timer: Timer;
  }[];
  canActSignaled: boolean;
  onCanActCb: () => Promise<void>;
  onCast: () => Promise<void>;
  onCastInterrupted: () => Promise<void>;
  onChannelInterrupted: () => Promise<void>;
  staggerSoundName?: string;
  ai?: BattleAI;
  isReviving: boolean;
}

const battleCharacterCreate = (
  ch: Character,
  position: BattlePosition
): BattleCharacter => {
  const skill = ch.skills[ch.skillIndex];
  const staggerDmg = ch.stats.STAGGER;
  const bCh: BattleCharacter = {
    ch,
    armor: 0,
    isDefeated: false,
    shouldRemove: false,
    actionTimer: new Timer(skill?.cooldown ?? 2000),
    actionReadyTimer: new Timer(1500),
    staggerTimer: new Timer(4000),
    staggerGauge: new Gauge(staggerDmg, 0.002),
    koTimer: new Timer(4000),
    castTimer: new Timer(1000),
    armorTimer: new Timer(250),
    position,
    positionMarker: -1,
    actionState: BattleActionState.IDLE,
    actionStateIndex: 0,
    statuses: [] as {
      status: BattleStatus;
      timer: Timer;
    }[],
    canActSignaled: false,
    onCanActCb: async function () {},
    onCast: async function () {},
    onCastInterrupted: async function () {},
    onChannelInterrupted: async function () {},
    ai: undefined,
    isReviving: false,
  };
  return bCh;
};

export const battleCharacterCreateEnemy = (
  ch: Character,
  template: BattleTemplateEnemy
): BattleCharacter => {
  if (ch.name.lastIndexOf('+') === -1) {
    ch.name = ch.name + '+' + randomId();
  }

  const bCh = battleCharacterCreate(ch, template.position);

  bCh.ai = getBattleAi(template.ai ?? 'BATTLE_AI_ATTACK');
  bCh.armor = template.armor ?? ch.template?.armor ?? 0;
  bCh.staggerSoundName = template.chTemplate.staggerSoundName;

  console.log(
    'ENEMY CREATED',
    bCh,
    getBattleAi(template.ai ?? 'BATTLE_AI_ATTACK')
  );

  return bCh;
};
export const battleCharacterCreateAlly = (
  ch: Character,
  args: {
    position: BattlePosition;
  }
): BattleCharacter => {
  const bCh = battleCharacterCreate(ch, args.position);
  const template = getCharacterTemplate(ch.name);
  if (template) {
    bCh.staggerSoundName = template.staggerSoundName;
    bCh.armor = template.armor ?? ch.template?.armor ?? 0;
  }
  bCh.armor += characterGetStatModifier(ch, 'armor');
  return bCh;
};

export const battleCharacterIsPreventingTurn = (bCh: BattleCharacter) => {
  return [BattleActionState.ACTING, BattleActionState.ACTING_READY].includes(
    bCh.actionState
  );
};

export const battleCharacterIsActing = (bCh: BattleCharacter) => {
  return [
    BattleActionState.ACTING,
    BattleActionState.ACTING_READY,
    BattleActionState.CASTING,
  ].includes(bCh.actionState);
};

export const battleCharacterIsActingReady = (bCh: BattleCharacter) => {
  return bCh.actionState === BattleActionState.ACTING_READY;
};

export const battleCharacterIsStaggered = (bCh: BattleCharacter) => {
  return (
    bCh.actionState === BattleActionState.STAGGERED ||
    bCh.actionState === BattleActionState.KNOCKED_DOWN
  );
};

export const battleCharacterIsKnockedDown = (bCh: BattleCharacter) => {
  return bCh.actionState === BattleActionState.KNOCKED_DOWN;
};

export const battleCharacterIsCasting = (bCh: BattleCharacter) => {
  return bCh.actionState === BattleActionState.CASTING;
};

export const battleCharacterIsChanneling = (bCh: BattleCharacter) => {
  return bCh.actionState === BattleActionState.CHANNELING;
};

export const battleCharacterSetActonState = (
  bCh: BattleCharacter,
  state: BattleActionState
) => {
  bCh.actionState = state;
};

export const battleCharacterCanAct = (
  battle: Battle,
  bCh: BattleCharacter
): boolean => {
  if (battle.isPaused) {
    return false;
  }
  if (bCh.actionState === BattleActionState.CHANNELING) {
    return true;
  }
  if (battleCharacterIsActing(bCh)) {
    return false;
  }
  if (battleCharacterIsStaggered(bCh) || battleCharacterIsKnockedDown(bCh)) {
    return false;
  }
  const ch = bCh.ch;
  const allegiance = battleGetAllegiance(battle, ch);
  const opposingBattleCharacters =
    allegiance === BattleAllegiance.ALLY ? battle.enemies : battle.allies;
  for (let i = 0; i < opposingBattleCharacters.length; i++) {
    const bc = opposingBattleCharacters[i];
    if (battleCharacterIsPreventingTurn(bc)) {
      return false;
    }
  }
  return bCh.actionTimer.isComplete();
};

export const battleCharacterSetCanActCb = (
  bCh: BattleCharacter,
  cb: () => Promise<void>
): void => {
  bCh.onCanActCb = cb;
};
export const battleCharacterRemoveCanActCb = (bCh: BattleCharacter): void => {
  bCh.onCanActCb = async function () {};
};

export const battleCharacterAddStatus = (
  bCh: BattleCharacter,
  status: BattleStatus,
  ms?: number
) => {
  if (!bCh.statuses.find(s => s.status === status)) {
    const timer = new Timer(ms ?? 10000);
    timer.start();
    bCh.statuses.push({
      status,
      timer,
    });
  }
};

export const battleCharacterRemoveStatus = (
  bCh: BattleCharacter,
  status: BattleStatus
) => {
  const ind = bCh.statuses.findIndex(s => status === s.status);
  if (ind > -1) {
    bCh.statuses.splice(ind, 1);
  }
};

export const battleCharacterHasStatus = (
  bCh: BattleCharacter,
  status: BattleStatus
) => {
  const ind = bCh.statuses.findIndex(s => status === s.status);
  return ind > -1;
};

export const battleCharacterGetSelectedSkill = (
  bCh: BattleCharacter
): BattleAction => {
  const skill = bCh.ch.skills[bCh.ch.skillIndex] ?? getBattleAction('NoWeapon');
  return skill;
};

export const battleCharacterGetEvasion = (bCh: BattleCharacter) => {
  return bCh.ch.stats.EVA;
};

export const battleCharacterSetAnimationStateAfterTakingDamage = (
  bCh: BattleCharacter
) => {
  if (battleCharacterIsKnockedDown(bCh)) {
    characterSetAnimationState(
      bCh.ch,
      AnimationState.BATTLE_KNOCKED_DOWN_DMG,
      true
    );
  } else if (battleCharacterIsStaggered(bCh)) {
    characterSetAnimationState(bCh.ch, AnimationState.BATTLE_STAGGERED, true);
  } else {
    characterSetAnimationState(bCh.ch, AnimationState.BATTLE_DAMAGED, true);
    characterOnAnimationCompletion(bCh.ch, () => {
      if (battleCharacterIsStaggered(bCh)) {
        characterSetAnimationState(
          bCh.ch,
          AnimationState.BATTLE_STAGGERED,
          true
        );
      } else {
        battleCharacterSetAnimationIdle(bCh);
      }
    });
  }
};

export const battleCharacterSetAnimationIdle = (bCh: BattleCharacter) => {
  if (battleCharacterIsChanneling(bCh)) {
    characterSetAnimationState(bCh.ch, AnimationState.BATTLE_CHANNEL);
  } else if (battleCharacterIsCasting(bCh)) {
    characterSetAnimationState(bCh.ch, AnimationState.BATTLE_CAST);
  } else if (bCh.ch.weaponEquipState === WeaponEquipState.RANGED) {
    characterSetAnimationState(bCh.ch, AnimationState.BATTLE_IDLE_RANGED);
  } else {
    characterSetAnimationState(bCh.ch, AnimationState.BATTLE_IDLE);
  }
};

export const battleCharacterSetAnimationStateAttack = (
  bCh: BattleCharacter,
  actionType: BattleActionType,
  swingType?: SwingType
) => {
  switch (actionType) {
    case BattleActionType.RANGED: {
      characterSetAnimationState(bCh.ch, AnimationState.BATTLE_RANGED);
      break;
    }
    case BattleActionType.CAST: {
      characterSetAnimationState(bCh.ch, AnimationState.BATTLE_CAST);
      break;
    }
    case BattleActionType.CHANNEL: {
      console.error('No channel type implemented to set animation');
      break;
    }
    case BattleActionType.SWING: {
      switch (swingType) {
        case SwingType.NORMAL: {
          characterSetAnimationState(bCh.ch, AnimationState.BATTLE_ATTACK);
          break;
        }
        case SwingType.PIERCE: {
          if (
            characterHasAnimationState(
              bCh.ch,
              AnimationState.BATTLE_ATTACK_PIERCE
            )
          ) {
            characterSetAnimationState(
              bCh.ch,
              AnimationState.BATTLE_ATTACK_PIERCE
            );
            break;
          } else {
            characterSetAnimationState(bCh.ch, AnimationState.BATTLE_ATTACK);
          }
        }
        case SwingType.KNOCK_DOWN: {
          if (
            characterHasAnimationState(
              bCh.ch,
              AnimationState.BATTLE_ATTACK_KNOCKDOWN
            )
          ) {
            characterSetAnimationState(
              bCh.ch,
              AnimationState.BATTLE_ATTACK_KNOCKDOWN
            );
            break;
          } else {
            characterSetAnimationState(bCh.ch, AnimationState.BATTLE_ATTACK);
          }
        }
        case SwingType.FINISH: {
          if (
            characterHasAnimationState(
              bCh.ch,
              AnimationState.BATTLE_ATTACK_FINISH
            )
          ) {
            characterSetAnimationState(
              bCh.ch,
              AnimationState.BATTLE_ATTACK_FINISH
            );
            break;
          } else {
            characterSetAnimationState(bCh.ch, AnimationState.BATTLE_ATTACK);
          }
        }
      }
    }
  }
};

export const battleCharacterRecoverFromKnockDown = (
  bCh: BattleCharacter,
  battle: Battle
) => {
  if (battleCharacterIsKnockedDown(bCh) && !bCh.isReviving) {
    bCh.koTimer.start();
    bCh.koTimer.pause();
    bCh.isReviving = true;
    if (characterHasAnimationState(bCh.ch, AnimationState.BATTLE_REVIVE)) {
      characterSetAnimationState(bCh.ch, AnimationState.BATTLE_REVIVE);
      characterOnAnimationCompletion(bCh.ch, () => {
        bCh.isReviving = false;
        bCh.actionTimer.unpause();
        battleInvokeEvent(battle, BattleEvent.onCharacterRecovered, bCh);
        battleCharacterSetActonState(bCh, BattleActionState.IDLE);
      });
    } else {
      timeoutPromise(500).then(() => {
        bCh.isReviving = false;
        bCh.actionTimer.unpause();
        battleInvokeEvent(battle, BattleEvent.onCharacterRecovered, bCh);
        battleCharacterSetActonState(bCh, BattleActionState.IDLE);
      });
    }
  }
};

export const battleCharacterRecoverFromStagger = (
  bCh: BattleCharacter,
  battle: Battle
) => {
  if (battleCharacterIsStaggered(bCh) && !bCh.isReviving) {
    bCh.staggerTimer.start();
    bCh.staggerTimer.pause();
    battleCharacterSetAnimationIdle(bCh);
    bCh.actionTimer.unpause();
    battleInvokeEvent(battle, BattleEvent.onCharacterRecovered, bCh);
    battleCharacterSetActonState(bCh, BattleActionState.IDLE);
  }
};

export const updateBattleCharacter = (
  battle: Battle,
  bCh: BattleCharacter
): void => {
  if (bCh.ch.hp <= 0) {
    // enforce the animation state of defeated every frame
    if (
      characterGetAnimationState(bCh.ch) !== AnimationState.BATTLE_DEFEATED &&
      characterGetAnimationState(bCh.ch) !== AnimationState.BATTLE_DEAD
    ) {
      characterSetAnimationState(bCh.ch, AnimationState.BATTLE_DEFEATED);
    }

    if (!bCh.isDefeated) {
      bCh.isDefeated = true;
      characterSetAnimationState(bCh.ch, AnimationState.BATTLE_DEFEATED);
      playSoundName('dead');

      bCh.staggerGauge.empty();
      bCh.staggerTimer.start();
      bCh.staggerTimer.pause();
      bCh.koTimer.start();
      bCh.koTimer.pause();
      bCh.actionState = BattleActionState.IDLE;

      // HACK: assumes that a character can only die at the end of a turn
      const removeCharacter = () => {
        battleInvokeEvent(battle, BattleEvent.onCharacterDamaged, bCh);
        battleUnsubscribeEvent(
          battle,
          BattleEvent.onTurnEnded,
          removeCharacter
        );

        // HACK: it's possible to use an item to revive a character as they are dying
        // before the turn is over, so it is important to short-circuit this cb
        // if that is the case
        if (!bCh.isDefeated) {
          return;
        }

        let ind = battle.enemies.indexOf(bCh);
        // if ch is an enemy, remove from room
        if (ind > -1) {
          bCh.shouldRemove = true;
          battle.defeated.push(bCh);
          roomRemoveCharacter(battle.room, bCh.ch);
          return;
        }
        ind = battle.allies.indexOf(bCh);
        if (ind > -1) {
          bCh.shouldRemove = true;
          battle.defeated.push(bCh);
        }
      };
      battleSubscribeEvent(battle, BattleEvent.onTurnEnded, removeCharacter);
    }
    return;
  }

  if (battle.isCompleted) {
    return;
  }

  if (battleCharacterIsKnockedDown(bCh) && !bCh.isReviving) {
    if (bCh.koTimer.isComplete()) {
      battleCharacterRecoverFromKnockDown(bCh, battle);
    }
  } else if (battleCharacterIsStaggered(bCh) && !bCh.isReviving) {
    if (bCh.staggerTimer.isComplete()) {
      battleCharacterRecoverFromStagger(bCh, battle);
    }
  }
  if (battleCharacterIsCasting(bCh)) {
    if (bCh.castTimer.isComplete()) {
      completeCast(bCh);
    }
  }

  if (battleCharacterIsActingReady(bCh) && bCh.actionReadyTimer.isComplete()) {
    bCh.actionStateIndex = 0;
    endAction(bCh);
  }

  for (let i = 0; i < bCh.statuses.length; i++) {
    const obj = bCh.statuses[i];
    obj.timer.update();
    if (obj.timer.isComplete()) {
      bCh.statuses.splice(i, 1);
      i--;
    }
  }

  bCh.staggerGauge.update();

  if (battleCharacterIsActing(bCh)) {
    if (battleCharacterIsActingReady(bCh)) {
      if (bCh.ai) {
        bCh.ai(battle, bCh);
      }
    }
  } else {
    if (battleCharacterCanAct(battle, bCh)) {
      if (!bCh.canActSignaled) {
        bCh.canActSignaled = true;
        battleInvokeEvent(battle, BattleEvent.onCharacterReady, bCh);
      }

      bCh.onCanActCb();
      if (bCh.ai && !battleCharacterIsChanneling(bCh)) {
        bCh.ai(battle, bCh);
      }
    }
  }
};
