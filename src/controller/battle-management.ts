import {
  Battle,
  BattleTemplate,
  BattleTemplateEnemy,
  battleCreate,
  battleSetActorPositions,
  battleIsVictory,
  battleIsLoss,
  BattleEvent,
  battleInvokeEvent,
  battleGetActingAllegiance,
  battleGetAllegiance,
} from 'model/battle';
import {
  battleCharacterCreateEnemy,
  battleCharacterCreateAlly,
  BattleCharacter,
  battleCharacterCanAct,
  battleCharacterGetSelectedSkill,
  updateBattleCharacter,
  battleCharacterSetAnimationStateAfterTakingDamage,
  battleCharacterSetActonState,
  BattleActionState,
  battleCharacterIsStaggered,
  battleCharacterIsCasting,
} from 'model/battle-character';
import {
  Character,
  characterCreateFromTemplate,
  characterGetPosCenterPx,
  characterSetAnimationState,
  characterOnAnimationCompletion,
  characterSetFacing,
  AnimationState,
  characterModifyHp,
  Facing,
  characterSetTransform,
} from 'model/character';
import { roomAddParticle, roomAddCharacter } from 'model/room';
import { getRoom } from 'db/overworlds';
import {
  setCurrentRoom,
  getCurrentRoom,
  setCurrentBattle,
  getCurrentBattle,
  disableKeyUpdate,
  enableKeyUpdate,
  getCurrentScene,
  getIsPaused,
  getKeyUpdateEnabled,
  setCurrentPlayer,
  getTriggersVisible,
  hideTriggers,
  hideMarkers,
  showTriggers,
  showMarkers,
} from 'model/generics';
import { Player, playerGetBattlePosition } from 'model/player';
import { createDamageParticle, createStatusParticle } from 'model/particle';
import { getRandBetween } from 'utils';
import { AppSection } from 'model/store';
import {
  hideSection,
  setBattleCharacterIndexSelected,
  showSection,
} from 'controller/ui-actions';
import { BattleAction, BattleActions } from 'controller/battle-actions';
import { pause, unpause } from './loop';
import { callScript } from 'controller/scene-management';
import { popKeyHandler, pushKeyHandler } from './events';
import { getUiInterface } from 'view/ui';

export const initiateBattle = (
  player: Player,
  template: BattleTemplate
): Battle => {
  const room = getRoom(template.roomName);
  room.characters = [];

  const enemies = template.enemies.map((t: BattleTemplateEnemy) => {
    const ch = characterCreateFromTemplate(t.chTemplate);
    roomAddCharacter(room, ch);
    return battleCharacterCreateEnemy(ch, t);
  });
  const allies = player.party.map((ch: Character) => {
    roomAddCharacter(room, ch);
    return battleCharacterCreateAlly(ch, {
      position: playerGetBattlePosition(player, ch),
    });
  });

  const battle = battleCreate(room, allies, enemies);

  battle.allies.forEach(resetCooldownTimer);
  battle.enemies.forEach(resetCooldownTimer);

  battle.allies.forEach(ally => {
    characterSetFacing(ally.ch, Facing.RIGHT);
    characterSetAnimationState(ally.ch, AnimationState.BATTLE_IDLE);
  });

  setCurrentPlayer(player);
  setCurrentBattle(battle);
  setCurrentRoom(room);
  battleSetActorPositions(battle);

  pushKeyHandler(battleKeyHandler);
  showSection(AppSection.BattleUI, true);

  console.log('CREATE BATTLE', battle);

  return battle;
};

export const battleKeyHandler = async (ev: KeyboardEvent) => {
  const battle = getCurrentBattle();
  const isPaused = getIsPaused();
  switch (ev.key) {
    case 'p':
    case 'P': {
      if (isPaused) {
        unpause();
      } else {
        pause();
      }
      break;
    }
    case 'd': {
      if (getTriggersVisible()) {
        hideTriggers();
        hideMarkers();
      } else {
        showTriggers();
        showMarkers();
      }
      break;
    }
    case 'x':
    case 'X': {
      if (!isPaused) {
        const bCh = battle.allies[0];
        const skill = battleCharacterGetSelectedSkill(bCh);
        invokeSkill(bCh, skill);
      }
      break;
    }
    case 'c':
    case 'C': {
      if (!isPaused) {
        const bCh = battle.allies[1];
        const skill = battleCharacterGetSelectedSkill(bCh);
        invokeSkill(bCh, skill);
      }
      break;
    }
    case 'Tab': {
      if (isPaused) {
        const uiState = getUiInterface().appState.battle;
        const battle = getCurrentBattle();
        let nextIndex =
          (uiState.characterIndexSelected + 1) % battle.allies.length;
        if (nextIndex === -1) {
          nextIndex = battle.allies.length - 1;
        }
        setBattleCharacterIndexSelected(nextIndex);
        ev.preventDefault();
      }
      break;
    }
    case ' ': {
      if (isPaused) {
        unpause();
      } else {
        pause();
      }
      break;
    }
  }
};

const assertMayAct = (battle: Battle, bCh: BattleCharacter): boolean => {
  if (bCh.actionState === BattleActionState.ACTING_READY) {
    return true;
  }

  // special case, battleCharacterCanAct returns true for the CASTING state, but that
  // should not be the case here.
  if (bCh.actionState === BattleActionState.CASTING) {
    return false;
  }

  if (!battleCharacterCanAct(battle, bCh)) {
    console.log('cannot attack, battle character cannot act yet', bCh);
    return false;
  }
  return true;
};

export const invokeSkill = (bCh: BattleCharacter, skill: BattleAction) => {
  const battle = getCurrentBattle();
  if (!assertMayAct(battle, bCh)) {
    return;
  }

  skill.cb(battle, bCh);
};

export const beginAction = async (bCh: BattleCharacter): Promise<void> => {
  console.log('begin action', bCh);
  const battle = getCurrentBattle();

  // no allegiance is acting
  if (battleGetActingAllegiance(battle) === null) {
    battleInvokeEvent(
      battle,
      BattleEvent.onTurnStarted,
      battleGetAllegiance(battle, bCh.ch)
    );
  }

  battleCharacterSetActonState(bCh, BattleActionState.ACTING);
  battleInvokeEvent(getCurrentBattle(), BattleEvent.onCharacterAction, bCh);
  bCh.actionTimer.start();
  bCh.actionTimer.pause();
};
export const endAction = async (bCh: BattleCharacter): Promise<void> => {
  console.log('end action', bCh);
  const battle = getCurrentBattle();

  battleCharacterSetActonState(bCh, BattleActionState.ACTING);
  const transform = bCh.ch.transform;
  if (transform) {
    const inverseTransform = transform.createInverse();
    characterSetTransform(bCh.ch, inverseTransform);
    characterSetAnimationState(bCh.ch, AnimationState.BATTLE_JUMP);
    await inverseTransform.timer.onCompletion();
    inverseTransform.markForRemoval();
  }
  characterSetAnimationState(bCh.ch, AnimationState.BATTLE_IDLE);
  battleCharacterSetActonState(bCh, BattleActionState.IDLE);
  resetCooldownTimer(bCh);
  bCh.actionTimer.unpause();

  bCh.canActSignaled = false;

  // no more allegiance is acting
  if (battleGetActingAllegiance(battle) === null) {
    battleInvokeEvent(
      battle,
      BattleEvent.onTurnEnded,
      battleGetAllegiance(battle, bCh.ch)
    );
  }
};

export const applyStaggerDamage = (
  bCh: BattleCharacter,
  staggerDamage: number
) => {
  console.log('apply stagger damage of', staggerDamage, 'to', bCh.ch.name);
  if (battleCharacterIsStaggered(bCh)) {
    bCh.staggerTimer.start();
  } else {
    bCh.staggerGauge.fill(staggerDamage);
    if (bCh.staggerGauge.isFull()) {
      console.log('STAGGER!');
      battleInvokeEvent(
        getCurrentBattle(),
        BattleEvent.onCharacterStaggered,
        bCh
      );
      battleCharacterSetActonState(bCh, BattleActionState.STAGGERED);
      bCh.staggerTimer.start();
      bCh.staggerGauge.empty();

      const [centerPx, centerPy] = characterGetPosCenterPx(bCh.ch);
      roomAddParticle(
        getCurrentRoom(),
        createStatusParticle('Staggered', centerPx, centerPy, 'orange')
      );
      characterSetAnimationState(bCh.ch, AnimationState.BATTLE_STAGGERED);
    }
  }
};

export const applyStandardDamage = (
  battle: Battle,
  attacker: BattleCharacter,
  victim: BattleCharacter,
  baseDamage: number,
  staggerDamage: number
): void => {
  let particleColor = '#fff';
  const maxDamage = baseDamage + attacker.ch.stats.POW;
  const minDamage = maxDamage - Math.ceil(maxDamage / 4);
  let damage = Math.floor(getRandBetween(minDamage, maxDamage));

  if (battleCharacterIsStaggered(victim)) {
    damage *= 2;
    particleColor = '#f77';
  }
  applyStaggerDamage(victim, staggerDamage);

  interruptCast(victim);

  // TODO Evasion

  // TODO Pinned

  // TODO Armor

  // TODO Damage Reduction

  damage = Math.max(1, damage);
  applyDamage(battle, victim, damage, particleColor);
};

export const applyMagicDamage = (
  battle: Battle,
  attacker: BattleCharacter,
  victim: BattleCharacter,
  baseDamage: number,
  staggerDamage: number
): void => {
  const maxDamage = baseDamage + attacker.ch.stats.POW;
  const minDamage = maxDamage - Math.ceil(maxDamage / 4);
  let damage = Math.floor(getRandBetween(minDamage, maxDamage));

  if (battleCharacterIsStaggered(victim)) {
    damage *= 2;
  }
  applyStaggerDamage(victim, staggerDamage);

  interruptCast(victim);

  // TODO Magic Shield

  // TODO Evasion

  // TODO Pinned

  damage = Math.max(1, damage);
  applyDamage(battle, victim, damage, '#fff');
};

export const resetCooldownTimer = (bCh: BattleCharacter) => {
  const skill = bCh.ch.skills[bCh.ch.skillIndex];
  const speed = bCh.ch.stats.SPD;
  if (skill) {
    // taken from calc for ability haste
    // https://www.reddit.com/r/leagueoflegends/comments/i5m8m6/i_made_a_chart_to_convert_cdr_to_ability_haste/
    const cdr = 1 - 1 / (1 + speed / 100);
    // all skills must have a cooldown of at least 1 second
    const newTime = Math.max(skill.cooldown - skill.cooldown * cdr, 1000);
    bCh.actionTimer.duration = newTime;
  }
};

export const setCasting = (
  bCh: BattleCharacter,
  castArgs: {
    castTime: number;
    onCast?: () => Promise<void>;
    onInterrupt?: () => Promise<void>;
  }
) => {
  battleCharacterSetActonState(bCh, BattleActionState.CASTING);
  characterSetAnimationState(bCh.ch, AnimationState.BATTLE_CAST);

  const [centerPx, centerPy] = characterGetPosCenterPx(bCh.ch);
  roomAddParticle(
    getCurrentRoom(),
    createStatusParticle(`Casting`, centerPx, centerPy)
  );

  bCh.actionTimer.pause();
  bCh.castTimer.duration = castArgs.castTime;
  bCh.castTimer.start();
  bCh.onCast = async () => {
    bCh.actionTimer.unpause();
    if (castArgs.onCast) {
      await castArgs.onCast();
    }
  };
  bCh.onCastInterrupted = async () => {
    bCh.actionTimer.unpause();
    if (castArgs.onInterrupt) {
      await castArgs.onInterrupt();
    }
  };
};

export const interruptCast = (bCh: BattleCharacter) => {
  if (battleCharacterIsCasting(bCh)) {
    battleCharacterSetActonState(bCh, BattleActionState.IDLE);
    battleInvokeEvent(
      getCurrentBattle(),
      BattleEvent.onCharacterInterrupted,
      bCh
    );
    bCh.onCastInterrupted();
    const [centerPx, centerPy] = characterGetPosCenterPx(bCh.ch);
    roomAddParticle(
      getCurrentRoom(),
      createStatusParticle('Interrupted', centerPx, centerPy, 'cyan')
    );
  }
};

export const completeCast = async (bCh: BattleCharacter) => {
  if (battleCharacterCanAct(getCurrentBattle(), bCh)) {
    await beginAction(bCh);
    battleInvokeEvent(getCurrentBattle(), BattleEvent.onCharacterSpell, bCh);
    await bCh.onCast();
    await endAction(bCh);
  }
};

export const applyDamage = (
  battle: Battle,
  bCh: BattleCharacter,
  dmg: number,
  particleColor: string
): void => {
  console.log('apply damage to', dmg, bCh.ch.name);
  const [centerPx, centerPy] = characterGetPosCenterPx(bCh.ch);
  roomAddParticle(
    battle.room,
    createDamageParticle(
      `${dmg}${particleColor === '#fff' ? '' : '!'}`,
      centerPx,
      centerPy,
      particleColor
    )
  );
  characterModifyHp(bCh.ch, -dmg);
  battleCharacterSetAnimationStateAfterTakingDamage(bCh);
  battleInvokeEvent(getCurrentBattle(), BattleEvent.onCharacterDamaged, bCh);
};

export const updateBattle = (battle: Battle): void => {
  for (let i = 0; i < battle.allies.length; i++) {
    const bCh = battle.allies[i];
    updateBattleCharacter(battle, bCh);
    if (bCh.shouldRemove) {
      battle.allies.splice(i, 1);
      i--;
    }
  }
  for (let i = 0; i < battle.enemies.length; i++) {
    const bCh = battle.enemies[i];
    updateBattleCharacter(battle, bCh);
    if (bCh.shouldRemove) {
      battle.enemies.splice(i, 1);
      i--;
    }
  }

  if (!battle.isCompleted) {
    if (battleIsVictory(battle)) {
      battle.isCompleted = true;
      showSection(AppSection.BattleVictory, true);
      for (const i in battle.allies) {
        characterSetAnimationState(
          battle.allies[i].ch,
          AnimationState.BATTLE_FLOURISH
        );
      }
      setTimeout(() => {
        console.log('VICTORY!');
        popKeyHandler(battleKeyHandler);
        showSection(AppSection.Debug, true);
      }, 2000);
    } else if (battleIsLoss(battle)) {
      battle.isCompleted = true;
      showSection(AppSection.BattleDefeated, true);
      setTimeout(() => {
        console.log('DEFEAT!');
        showSection(AppSection.Debug, true);
      }, 2000);
    }
  }
};
