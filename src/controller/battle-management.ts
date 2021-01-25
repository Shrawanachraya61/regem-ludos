import {
  Battle,
  BattleTemplate,
  BattleTemplateEnemy,
  battleCharacterCreateEnemy,
  battleCharacterCreateAlly,
  battleCharacterSetStaggered,
  battleCharacterApplyDamage,
  battleSetActorPositions,
  BattleCharacter,
  battleCharacterCanAct,
  battleIsVictory,
  battleIsLoss,
} from 'model/battle';
import {
  Character,
  characterCreateFromTemplate,
  characterGetPosCenterPx,
  characterSetAnimationState,
  characterOnAnimationCompletion,
  AnimationState,
} from 'model/character';
import { roomAddParticle, roomAddCharacter } from 'model/room';
import { getRoom } from 'db/overworlds';
import { setCurrentRoom, setCurrentBattle } from 'model/generics';
import { Player, playerGetBattlePosition } from 'model/player';
import { createDamageParticle } from 'model/particle';
import { getRandBetween } from 'utils';
import { AppSection } from 'model/store';
import { showSection } from 'controller/ui-actions';
import { setCurrentPlayer } from 'model/generics';

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

  const battle = {
    room,
    isCompleted: false,
    enemies,
    defeated: [] as BattleCharacter[],
    allies: player.party.map((ch: Character) => {
      roomAddCharacter(room, ch);
      return battleCharacterCreateAlly(ch, {
        position: playerGetBattlePosition(player, ch),
      });
    }),
  };

  battle.allies.forEach(resetCooldownTimer);
  battle.enemies.forEach(resetCooldownTimer);

  battleSetActorPositions(battle);

  setCurrentPlayer(player);
  setCurrentBattle(battle);
  setCurrentRoom(room);
  return battle;
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
      for (let i in battle.allies) {
        characterSetAnimationState(
          battle.allies[i].ch,
          AnimationState.BATTLE_FLOURISH
        );
      }
      setTimeout(() => {
        console.log('VICTORY!');
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

  if (bCh.isStaggered) {
    if (bCh.staggerTimer.isComplete()) {
      bCh.isStaggered = false;
      characterSetAnimationState(bCh.ch, AnimationState.BATTLE_IDLE);
    }
  }
  if (bCh.isCasting) {
    if (bCh.castTimer.isComplete()) {
      completeCast(bCh);
    }
  }
  bCh.staggerGauge.update();

  if (!bCh.canAct) {
    if (battleCharacterCanAct(battle, bCh)) {
      bCh.canAct = true;
      bCh.onCanActCb();
      if (bCh.ai) {
        bCh.ai(battle, bCh);
      }
    }
  } else {
    bCh.canAct = battleCharacterCanAct(battle, bCh);
  }
};

export const beginAction = (battle: Battle, bCh: BattleCharacter): void => {
  console.log('begin action', bCh);
  bCh.isActing = true;
  bCh.actionTimer.start();
  bCh.actionTimer.pause();
};
export const endAction = (battle: Battle, bCh: BattleCharacter): void => {
  console.log('end action', bCh);
  bCh.isActing = false;
  resetCooldownTimer(bCh);
  bCh.actionTimer.unpause();
};

export const applyWeaponDamage = (
  battle: Battle,
  attacker: BattleCharacter,
  victim: BattleCharacter,
  damage: number,
  staggerPower: number
): void => {
  const maxDamage = damage + attacker.ch.stats.POW + attacker.ch.stats.ACC / 4;
  const minDamage =
    maxDamage / 2 + ((maxDamage / 2) * attacker.ch.stats.ACC) / 100;
  damage = getRandBetween(minDamage, maxDamage);
  if (victim.isStaggered) {
    victim.staggerTimer.start();
    damage *= 2;
  } else {
    victim.staggerGauge.fill(staggerPower);
    if (victim.staggerGauge.isFull()) {
      console.log('STAGGER!');
      battleCharacterSetStaggered(victim);
    }
  }

  if (victim.isCasting) {
    interruptCast(victim);
  }

  damage = Math.max(1, Math.floor(damage));
  const [centerPx, centerPy] = characterGetPosCenterPx(victim.ch);
  roomAddParticle(
    battle.room,
    createDamageParticle(String(damage), centerPx, centerPy)
  );
  battleCharacterApplyDamage(victim, damage);
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

export const calculateStaggerDamage = (ch: Character) => {
  return Math.max(ch.stats.STAGGER, 1);
};

export const setCasting = (
  bCh: BattleCharacter,
  castArgs: {
    castTime: number;
    onCast?: () => void;
    onInterrupt?: () => void;
  }
) => {
  bCh.isCasting = true;
  bCh.castTimer.duration = castArgs.castTime;
  bCh.castTimer.start();
  bCh.onCast = castArgs.onCast ?? function () {};
  bCh.onCastInterrupted = castArgs.onInterrupt ?? function () {};
};

export const interruptCast = (bCh: BattleCharacter) => {
  bCh.isCasting = false;
  bCh.onCastInterrupted();
};

export const completeCast = (bCh: BattleCharacter) => {
  bCh.isCasting = false;
  bCh.onCast();
};
