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
  battlePauseTimers,
  battleUnpauseTimers,
  BattleAllegiance,
  battleGetDefeatedCharacters,
  battleGetDyingCharacters,
  battleSubscribeEvent,
  battlePauseActionTimers,
  battleUnpauseActionTimers,
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
  battleCharacterSetAnimationIdle,
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
  characterGetPos,
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
  setGlobalParticleSystem,
  getCurrentPlayer,
} from 'model/generics';
import { Player, playerGetBattlePosition } from 'model/player';
import {
  createDamageParticle,
  createStatusParticle,
  createWeightedParticle,
  EFFECT_TEMPLATE_ARMOR_REDUCED,
  EFFECT_TEMPLATE_DEAD32,
  EFFECT_TEMPLATE_GEM,
  EFFECT_TEMPLATE_TREASURE,
  particleCreateFromTemplate,
} from 'model/particle';
import { getRandBetween, Point3d, timeoutPromise } from 'utils';
import { AppSection } from 'model/store';
import {
  hideSection,
  setBattleCharacterIndexSelected,
  showSection,
} from 'controller/ui-actions';
import {
  BattleAction,
  BattleActions,
  createParticleAtCharacter,
  SwingType,
} from 'controller/battle-actions';
import { pause, unpause } from './loop';
import { callScript } from 'controller/scene-management';
import { popKeyHandler, pushKeyHandler, pushEmptyKeyHandler } from './events';
import { getUiInterface, renderUi } from 'view/ui';
import { colors } from 'view/style';
import { createBattleTransitionParticleSystem } from 'model/particle-system';
import { getImageDataScreenshot } from 'view/draw';
import { fadeIn, fadeOut } from './scene-commands';
import {
  Transform,
  TransformEase,
  transformOffsetJumpFar,
  transformOffsetJumpMedium,
  transformOffsetJumpShort,
} from 'model/utility';

export const transitionToBattle = async (
  player: Player,
  template: BattleTemplate,
  onCompletion?: any,
  skipIntro?: boolean
) => {
  if (skipIntro) {
    initiateBattle(player, template);
    return;
  }

  const ps = createBattleTransitionParticleSystem(getImageDataScreenshot());
  setGlobalParticleSystem(ps);
  const handler = pushEmptyKeyHandler();
  setTimeout(() => {
    fadeOut(100, true);
  }, 1250);
  setTimeout(() => {
    setGlobalParticleSystem(null);
    popKeyHandler(handler);
    const battle = initiateBattle(player, template);
    battlePauseTimers(battle);
    fadeIn(250);

    const jumpTimeMs = 500;
    const jumpTimeMsPostLag = 500;
    const jumpTimeMsStaggered = 75;
    battle.allies.forEach((bCh, i) => {
      const endPoint = characterGetPos(bCh.ch);
      const startPoint = [
        endPoint[0] - 16 * 6,
        endPoint[1] + 16 * 6,
        0,
      ] as Point3d;
      const transform = new Transform(
        startPoint,
        endPoint,
        jumpTimeMs,
        TransformEase.LINEAR,
        transformOffsetJumpFar
      );
      characterSetTransform(bCh.ch, transform);
      transform.timer.pause();

      timeoutPromise(500 + i * jumpTimeMsStaggered).then(() => {
        characterSetAnimationState(bCh.ch, AnimationState.BATTLE_JUMP);
        bCh.ch.transform?.timer.unpause();
        timeoutPromise(jumpTimeMs).then(() => {
          battleCharacterSetAnimationIdle(bCh);
        });
      });
    });

    // use timeoutPromise so that the battle can take over control of the timeouts
    // (like if the user pauses during the intro, the battle can pause this timer too)
    timeoutPromise(
      jumpTimeMs +
        (500 + battle.allies.length * jumpTimeMsStaggered) +
        jumpTimeMsPostLag
    ).then(() => {
      battleUnpauseTimers(battle);
    });
  }, 1500);
};

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
    battleCharacterSetAnimationIdle(ally);
  });

  setCurrentPlayer(player);
  setCurrentBattle(battle);
  setCurrentRoom(room);
  battleSetActorPositions(battle);

  pushKeyHandler(battleKeyHandler);
  showSection(AppSection.BattleUI, true);

  // While you are acting, all your characters have their action timers paused.
  // This prevents infinite chaining of attacks when speed is too fast.
  battleSubscribeEvent(
    battle,
    BattleEvent.onTurnStarted,
    (allegiance: BattleAllegiance) => {
      if (allegiance === BattleAllegiance.ALLY) {
        battlePauseActionTimers(battle, battle.allies);
      } else {
        battlePauseActionTimers(battle, battle.enemies);
      }
    }
  );
  battleSubscribeEvent(
    battle,
    BattleEvent.onTurnEnded,
    (allegiance: BattleAllegiance) => {
      if (allegiance === BattleAllegiance.ALLY) {
        battleUnpauseActionTimers(battle, battle.allies);
      } else {
        battleUnpauseActionTimers(battle, battle.enemies);
      }
    }
  );

  console.log('CREATE BATTLE', battle);

  return battle;
};

export const battleKeyHandler = async (ev: KeyboardEvent) => {
  const battle = getCurrentBattle();
  const isPaused = getIsPaused();
  switch (ev.key) {
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
    case 'q':
    case 'Q': {
      const bCh = battle.allies[0];
      const particle = createParticleAtCharacter(
        {
          ...EFFECT_TEMPLATE_DEAD32,
        },
        bCh.ch
      );
      roomAddParticle(battle.room, particle);
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
  // wait for everybody to finish their death animations
  if (battleGetDyingCharacters(battle).length) {
    return false;
  }

  if (bCh.actionState === BattleActionState.ACTING_READY) {
    return true;
  }

  // special case, battleCharacterCanAct returns true for the CASTING state, but that
  // should not be the case here. (prevents AI and Player from invoking a skill with a keypress,
  // but allows a character to cast a spell after a cast timer has concluded)
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
  battleInvokeEvent(getCurrentBattle(), BattleEvent.onCharacterAction, bCh);
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
  bCh.actionTimer.start();
  bCh.actionTimer.pause();

  battleInvokeEvent(battle, BattleEvent.onCharacterActionStarted, bCh);
};

export const endAction = async (bCh: BattleCharacter): Promise<void> => {
  console.log('end action', bCh);
  const battle = getCurrentBattle();

  if (battleCharacterIsCasting(bCh)) {
  } else {
    battleCharacterSetActonState(bCh, BattleActionState.ACTING);
    const transform = bCh.ch.transform;
    if (transform) {
      const inverseTransform = transform.createInverse();
      characterSetTransform(bCh.ch, inverseTransform);
      characterSetAnimationState(bCh.ch, AnimationState.BATTLE_JUMP);
      await inverseTransform.timer.onCompletion();
      inverseTransform.markForRemoval();
    }
    battleCharacterSetAnimationIdle(bCh);
    battleCharacterSetActonState(bCh, BattleActionState.IDLE);
  }

  bCh.canActSignaled = false;
  battleInvokeEvent(battle, BattleEvent.onCharacterActionEnded, bCh);

  // no more allegiance is acting
  if (battleGetActingAllegiance(battle) === null) {
    const defeatedCharacters = battleGetDefeatedCharacters(battle);
    if (defeatedCharacters.length) {
      const particleDuration = 1500;
      for (let i = 0; i < defeatedCharacters.length; i++) {
        const defeatedBCh = defeatedCharacters[i];
        // looks kinda dumb, maybe just do this for allied characters?
        // const particle = createParticleAtCharacter(
        //   {
        //     ...EFFECT_TEMPLATE_DEAD32,
        //   },
        //   defeatedBCh.ch
        // );
        // particleDuration = Math.max(particleDuration, particle.timer.duration);
        // roomAddParticle(battle.room, particle);
        characterSetAnimationState(defeatedBCh.ch, AnimationState.BATTLE_DEAD);

        // set target indices so that they are at least VALID, otherwise the player
        // can target things which are out-of-range by leaving the target on a defeated
        // character
        battle.targetedEnemyIndex = Math.max(
          0,
          battle.targetedEnemyIndex - defeatedCharacters.length
        );
        battle.targetedEnemyRangeIndex = Math.max(
          0,
          battle.targetedEnemyRangeIndex - defeatedCharacters.length
        );
      }
      await timeoutPromise(particleDuration);
      battleInvokeEvent(
        battle,
        BattleEvent.onTurnEnded,
        battleGetAllegiance(battle, bCh.ch)
      );
      // HACK: need to render here if the target does get changed or it won't show until
      // paused.  Must render after the character is dead, and since bCH removes itself
      // on the frame of onTurnEnded, there needs to be a delay before the forced render
      setTimeout(() => {
        renderUi();
      }, 100);
    } else {
      battleInvokeEvent(
        battle,
        BattleEvent.onTurnEnded,
        battleGetAllegiance(battle, bCh.ch)
      );
    }
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
      bCh.actionTimer.pause();

      // This particle makes a lot of visual noise, disabling it for now
      // const [centerPx, centerPy] = characterGetPosCenterPx(bCh.ch);
      // roomAddParticle(
      //   getCurrentRoom(),
      //   createStatusParticle('Staggered', centerPx, centerPy, 'orange')
      // );
      characterSetAnimationState(bCh.ch, AnimationState.BATTLE_STAGGERED);
    }
  }
};

export const applyArmorDamage = (
  battle: Battle,
  victim: BattleCharacter,
  damage: number,
  isPierce: boolean
): {
  nextDamageAmount: number;
} => {
  let nextDamageAmount = damage;
  let armorReduced = false;
  if (isPierce) {
    console.log('BROKE ARMOR WITH PIERCE ATTACK!');
    victim.armor--;
    armorReduced = true;
    nextDamageAmount = 0;
  } else if (victim.armorTimer.isComplete()) {
    victim.armorTimer.start();
    nextDamageAmount = 0;
  } else {
    console.log('BROKE ARMOR WITH SIMULTANEOUS ATTACK!');
    victim.armor--;
    armorReduced = true;
  }

  if (armorReduced) {
    const [centerPx, centerPy] = characterGetPosCenterPx(victim.ch);
    const particleWidth = 16;
    const particle = particleCreateFromTemplate(
      [centerPx + particleWidth / 2, centerPy - victim.ch.spriteHeight / 4],
      EFFECT_TEMPLATE_ARMOR_REDUCED
    );
    roomAddParticle(battle.room, particle);
  }

  return {
    nextDamageAmount,
  };
};

export const applySwingDamage = (
  battle: Battle,
  attacker: BattleCharacter,
  victim: BattleCharacter,
  args: {
    damage: number;
    staggerDamage: number;
    attackType: SwingType;
  }
): void => {
  const { damage: baseDamage, staggerDamage } = args;

  let particleColor = colors.WHITE;
  let particlePostfix = '';
  const maxDamage = baseDamage + attacker.ch.stats.POW;
  const minDamage = maxDamage - Math.ceil(maxDamage / 4);
  let damage = Math.floor(getRandBetween(minDamage, maxDamage));

  if (battleCharacterIsStaggered(victim)) {
    damage *= 2;
    particleColor = colors.ORANGE;
    particlePostfix = '!';
  } else if (victim.armor > 0) {
    const { nextDamageAmount } = applyArmorDamage(
      battle,
      victim,
      damage,
      args.attackType === SwingType.PIERCE
    );
    damage = nextDamageAmount;
  }

  applyStaggerDamage(victim, staggerDamage);

  if (victim.armor <= 0) {
    interruptCast(victim);
  }

  // TODO Evasion

  // TODO Knocked Down

  // TODO Damage Reduction

  damage = Math.max(0, damage);
  applyDamage(battle, victim, damage, particleColor, particlePostfix);
};

export const applyRangeDamage = (
  battle: Battle,
  attacker: BattleCharacter,
  victim: BattleCharacter,
  baseDamage: number,
  staggerDamage: number
): void => {
  let particlePostfix = '';
  const maxDamage = baseDamage + Math.floor(attacker.ch.stats.POW / 2);
  const minDamage = maxDamage - Math.ceil(maxDamage / 4);
  let damage = Math.floor(getRandBetween(minDamage, maxDamage));

  if (battleCharacterIsStaggered(victim)) {
    particlePostfix = '!';
    damage *= 2;
  } else if (victim.armor > 0) {
    const { nextDamageAmount } = applyArmorDamage(
      battle,
      victim,
      damage,
      false
    );
    damage = nextDamageAmount;
  }
  applyStaggerDamage(victim, staggerDamage);

  // TODO Evasion

  // TODO Pinned

  damage = Math.max(1, damage);
  applyDamage(battle, victim, damage, colors.WHITE, particlePostfix);
};

export const applyMagicDamage = (
  battle: Battle,
  attacker: BattleCharacter,
  victim: BattleCharacter,
  baseDamage: number,
  staggerDamage: number
): void => {
  let particlePostfix = '';

  const maxDamage = baseDamage + attacker.ch.stats.POW;
  const minDamage = maxDamage - Math.ceil(maxDamage / 4);
  let damage = Math.floor(getRandBetween(minDamage, maxDamage));

  if (battleCharacterIsStaggered(victim)) {
    particlePostfix = '!';
    damage *= 2;
  }
  applyStaggerDamage(victim, staggerDamage);

  interruptCast(victim);

  // TODO Magic Shield

  // TODO Evasion

  // TODO Pinned

  damage = Math.max(1, damage);
  applyDamage(battle, victim, damage, colors.LIGHTBLUE, particlePostfix);
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

    console.log('RESET COOLDOWN TIMER', bCh.ch.name, newTime, cdr, speed);
    bCh.actionTimer.start(newTime);
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
  battleInvokeEvent(getCurrentBattle(), BattleEvent.onCharacterCasting, bCh);

  const [centerPx, centerPy] = characterGetPosCenterPx(bCh.ch);
  roomAddParticle(
    getCurrentRoom(),
    createStatusParticle(`Casting`, centerPx, centerPy)
  );

  bCh.actionTimer.pause();
  bCh.castTimer.start(castArgs.castTime);
  bCh.onCast = async () => {
    if (castArgs.onCast) {
      await castArgs.onCast();
    }
  };
  bCh.onCastInterrupted = async () => {
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
    bCh.actionTimer.unpause();
    roomAddParticle(
      getCurrentRoom(),
      createStatusParticle('Interrupted', centerPx, centerPy, 'cyan')
    );
  }
};

export const completeCast = async (bCh: BattleCharacter) => {
  const battle = getCurrentBattle();
  const actingAllegiance = battleGetActingAllegiance(battle);
  console.log('COMPLETE CAST ALLEGIANCE: ', actingAllegiance);
  if (
    actingAllegiance === null ||
    actingAllegiance === battleGetAllegiance(battle, bCh.ch)
  ) {
    await beginAction(bCh);
    battleInvokeEvent(getCurrentBattle(), BattleEvent.onCharacterSpell, bCh);
    await bCh.onCast();

    // HACK: Hard reset the timer, somehow it gets messed up.
    bCh.actionTimer.unpause();
    bCh.actionTimer.start();
    bCh.actionTimer.pause();

    await endAction(bCh);
  }
};

export const applyDamage = (
  battle: Battle,
  bCh: BattleCharacter,
  dmg: number,
  particleColor: string,
  postfix?: string
): void => {
  console.log('apply damage to', dmg, bCh.ch.name);
  if (dmg > 0) {
    const [centerPx, centerPy] = characterGetPosCenterPx(bCh.ch);
    roomAddParticle(
      battle.room,
      createDamageParticle(
        `${dmg}${postfix ?? ''}`,
        centerPx,
        centerPy,
        particleColor
      )
    );
    characterModifyHp(bCh.ch, -dmg);
  }

  if (bCh.isDefeated) {
    const [centerPx, centerPy] = characterGetPosCenterPx(bCh.ch);
    roomAddParticle(
      battle.room,
      createWeightedParticle(EFFECT_TEMPLATE_GEM, centerPx, centerPy, 1000)
    );
  }

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
      // HACK: last enemy remains without this for some reason
      battle.isCompleted = true;
      popKeyHandler(battleKeyHandler);
      const showVictory = async () => {
        console.log('VICTORY');
        showSection(AppSection.BattleVictory, true);
        await timeoutPromise(2000);
        for (const i in battle.allies) {
          characterSetAnimationState(
            battle.allies[i].ch,
            AnimationState.BATTLE_FLOURISH
          );
        }
      };
      showVictory();
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
