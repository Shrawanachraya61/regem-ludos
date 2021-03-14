import { Room, tilePosToWorldPos } from 'model/room';
import {
  AnimationState,
  Character,
  characterSetAnimationState,
  CharacterTemplate,
  characterOnAnimationCompletion,
  characterModifyHp,
} from 'model/character';
import { Point, randomId } from 'utils';
import { BattleAI } from 'controller/battle-ai';
import { BattleAction } from 'controller/battle-actions';
import { completeCast, endAction } from 'controller/battle-management';
import { Timer, Gauge } from 'model/utility';
import {
  Battle,
  BattlePosition,
  Status,
  BattleTemplateEnemy,
  BattleAllegiance,
  battleGetCharactersOfAllegiance,
  battleGetOppositeAllegiance,
  battleGetAllegiance,
} from './battle';

export enum BattleActionState {
  IDLE = 'idle',
  ACTING = 'acting',
  ACTING_READY = 'acting-ready',
  CASTING = 'casting',
  STAGGERED = 'staggered',
  PINNED = 'pinned',
}

export interface BattleCharacter {
  ch: Character;
  isDefeated: boolean;
  shouldRemove: boolean;
  actionTimer: Timer; // cooldown timer
  actionReadyTimer: Timer; // timer for how long to wait while in the actionReady state
  staggerTimer: Timer;
  staggerGauge: Gauge;
  castTimer: Timer;
  position: BattlePosition;
  actionState: BattleActionState;
  actionStateIndex: number;
  statuses: Status[];
  onCanActCb: () => Promise<void>;
  onCast: () => Promise<void>;
  onCastInterrupted: () => Promise<void>;
  ai?: BattleAI;
}

const battleCharacterCreate = (
  ch: Character,
  position: BattlePosition,
  ai?: any
): BattleCharacter => {
  const skill = ch.skills[ch.skillIndex];
  const staggerDmg = ch.stats.STAGGER;
  return {
    ch,
    isDefeated: false,
    shouldRemove: false,
    actionTimer: new Timer(skill?.cooldown ?? 2000),
    actionReadyTimer: new Timer(1500),
    staggerTimer: new Timer(2000),
    staggerGauge: new Gauge(staggerDmg, 0.002),
    castTimer: new Timer(1000),
    position,
    actionState: BattleActionState.IDLE,
    actionStateIndex: 0,
    statuses: [] as Status[],
    onCanActCb: async function () {},
    onCast: async function () {},
    onCastInterrupted: async function () {},
    ai,
  };
};

export const battleCharacterCreateEnemy = (
  ch: Character,
  template: BattleTemplateEnemy
): BattleCharacter => {
  if (ch.name.lastIndexOf('+') === -1) {
    ch.name = ch.name + '+' + randomId();
  }
  return battleCharacterCreate(ch, template.position, template.ai);
};
export const battleCharacterCreateAlly = (
  ch: Character,
  args: {
    position: BattlePosition;
  }
): BattleCharacter => {
  return battleCharacterCreate(ch, args.position);
};

export const battleCharacterIsActing = (bCh: BattleCharacter) => {
  return (
    bCh.actionState === BattleActionState.ACTING ||
    bCh.actionState === BattleActionState.ACTING_READY
  );
};

export const battleCharacterIsActingReady = (bCh: BattleCharacter) => {
  return bCh.actionState === BattleActionState.ACTING_READY;
};

export const battleCharacterIsStaggered = (bCh: BattleCharacter) => {
  return (
    bCh.actionState === BattleActionState.STAGGERED ||
    bCh.actionState === BattleActionState.PINNED
  );
};

export const battleCharacterIsPinned = (bCh: BattleCharacter) => {
  return bCh.actionState === BattleActionState.PINNED;
};

export const battleCharacterIsCasting = (bCh: BattleCharacter) => {
  return bCh.actionState === BattleActionState.CASTING;
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
  if (battleCharacterIsActing(bCh)) {
    return false;
  }
  const ch = bCh.ch;
  const allegiance = battleGetAllegiance(battle, ch);
  const opposingBattleCharacters =
    allegiance === BattleAllegiance.ALLY ? battle.enemies : battle.allies;
  for (let i = 0; i < opposingBattleCharacters.length; i++) {
    const bc = opposingBattleCharacters[i];
    if (battleCharacterIsActing(bc)) {
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
  status: Status
) => {
  if (!bCh.statuses.includes(status)) {
    bCh.statuses.push(status);
  }
};

export const battleCharacterRemoveStatus = (
  bCh: BattleCharacter,
  status: Status
) => {
  const ind = bCh.statuses.indexOf(status);
  if (ind > -1) {
    bCh.statuses.splice(ind, 1);
  }
};

export const battleCharacterGetSelectedSkill = (
  bCh: BattleCharacter
): BattleAction => {
  const skill = bCh.ch.skills[bCh.ch.skillIndex];
  return skill;
};

export const battleCharacterSetAnimationStateAfterTakingDamage = (
  bCh: BattleCharacter
) => {
  if (battleCharacterIsStaggered(bCh)) {
    characterSetAnimationState(bCh.ch, AnimationState.BATTLE_STAGGERED);
  } else {
    characterSetAnimationState(bCh.ch, AnimationState.BATTLE_DAMAGED);
    characterOnAnimationCompletion(bCh.ch, () => {
      if (battleCharacterIsStaggered(bCh)) {
        characterSetAnimationState(bCh.ch, AnimationState.BATTLE_STAGGERED);
      } else {
        characterSetAnimationState(bCh.ch, AnimationState.BATTLE_IDLE);
      }
    });
  }
};

export const updateBattleCharacter = (
  battle: Battle,
  bCh: BattleCharacter
): void => {
  if (bCh.ch.hp <= 0) {
    if (!bCh.isDefeated) {
      bCh.isDefeated = true;
      characterSetAnimationState(bCh.ch, AnimationState.BATTLE_DEFEATED);
      characterOnAnimationCompletion(bCh.ch, () => {
        let ind = battle.enemies.indexOf(bCh);
        if (ind > -1) {
          bCh.shouldRemove = true;
          battle.defeated.push(bCh);
          return;
        }
        ind = battle.allies.indexOf(bCh);
        if (ind > -1) {
          bCh.shouldRemove = true;
          battle.defeated.push(bCh);
        }
      });
    }
    return;
  }

  if (battle.isCompleted) {
    return;
  }

  if (battleCharacterIsStaggered(bCh)) {
    if (bCh.staggerTimer.isComplete()) {
      battleCharacterSetActonState(bCh, BattleActionState.IDLE);
      characterSetAnimationState(bCh.ch, AnimationState.BATTLE_IDLE);
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

  bCh.staggerGauge.update();

  if (!battleCharacterIsActing(bCh)) {
    if (battleCharacterCanAct(battle, bCh)) {
      bCh.onCanActCb();
      if (bCh.ai) {
        bCh.ai(battle, bCh);
      }
    }
  }
};
