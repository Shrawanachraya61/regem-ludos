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
  battleGetPersistentEffects,
  PersistentEffectEvent,
  BattleDamageType,
  OnBeforeCharacterDamagedCb,
  PersistentEffectEventParams,
  battleGetTargetedEnemy,
  battleIsEnemyTargetableByMelee,
  battleSetEnemyTargetIndex,
  battleCycleMeleeTarget,
  battleCycleRangeTarget,
  BattleStatus,
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
  battleCharacterIsChanneling,
  battleCharacterGetEvasion,
  battleCharacterHasStatus,
  battleCharacterIsKnockedDown,
  battleCharacterIsDefeated,
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
  characterSetPos,
  characterGetAnimation,
} from 'model/character';
import { roomAddParticle, roomAddCharacter, Room } from 'model/room';
import { getRoom, get as getRoomTemplate } from 'db/overworlds';
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
  getCurrentOverworld,
  setCameraTransform,
  getCameraTransform,
} from 'model/generics';
import {
  Player,
  playerGetBattlePosition,
  playerGetCameraOffset,
} from 'model/player';
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
  hideSections,
  setBattleCharacterIndexSelected,
  showSection,
} from 'controller/ui-actions';
import {
  BattleAction,
  BattleActions,
  BattleActionType,
  createParticleAtCharacter,
  SwingType,
} from 'controller/battle-actions';
import { pause, unpause } from './loop';
import { callScript, createAndCallScript } from 'controller/scene-management';
import { popKeyHandler, pushKeyHandler, pushEmptyKeyHandler } from './events';
import { getUiInterface, renderUi } from 'view/ui';
import { colors } from 'view/style';
import { createBattleTransitionParticleSystem } from 'model/particle-system';
import { getImageDataScreenshot } from 'view/draw';
import {
  fadeIn,
  fadeOut,
  panCameraBackToPlayer,
  panCameraRelativeToPlayer,
} from 'controller/scene/scene-commands';
import {
  Timer,
  Transform,
  TransformEase,
  transformOffsetJumpFar,
  transformOffsetJumpMedium,
  transformOffsetJumpShort,
} from 'model/utility';
import {
  getCurrentMusic,
  musicGetCurrentPlaybackPosition,
  musicSetPlaybackPosition,
  playMusic,
  playSound,
  playSoundName,
  stopCurrentMusic,
} from 'model/sound';
import { overworldShow } from 'model/overworld';
import { sceneIsWaiting, sceneSetEncounterDefeated } from 'model/scene';
import { getScreenSize } from 'model/canvas';

export const transitionToBattle = async (
  player: Player,
  template: BattleTemplate,
  onCompletion?: () => void,
  skipIntro?: boolean
) => {
  hideSection(AppSection.Debug);
  stopCurrentMusic(500);

  const [screenW, screenH] = getScreenSize();
  const t = new Transform(
    [0, 0, 0],
    [screenW / 2 - 32 / 2, screenH / 4 - 13, 0],
    1,
    TransformEase.EASE_OUT
  );
  setCameraTransform(t);

  if (skipIntro) {
    const battle = initiateBattle(player, template);
    battle.isPaused = true;
    battlePauseTimers(battle);
    if (template.events?.onBattleStart) {
      await template.events?.onBattleStart(battle);
      setTimeout(() => {
        renderUi();
      }, 100);
    }
    showSection(AppSection.BattleUI, true);
    await invokeAllChannels(battle);
    battle.isPaused = false;
    battle.isStarted = true;
    battleUnpauseTimers(battle);
    battleSubscribeEvent(battle, BattleEvent.onCompletion, () => {
      stopCurrentMusic(1000);
      if (onCompletion) {
        onCompletion();
      }
    });
    return;
  }

  const ps = createBattleTransitionParticleSystem(getImageDataScreenshot());
  setGlobalParticleSystem(ps);
  const handler = pushEmptyKeyHandler();
  setTimeout(() => {
    fadeOut(100, true);
    playMusic(template.music ?? 'music_battle1', true);
  }, 1250);
  setTimeout(() => {
    setGlobalParticleSystem(null);
    popKeyHandler(handler);
    const battle = initiateBattle(player, template);
    battle.transitioning = true;
    battle.isPaused = true;
    battlePauseTimers(battle);
    fadeIn(250);

    const jumpTimeMs = 500;
    const jumpTimeMsPostLag = 500;
    const jumpTimeMsStaggered = 250;
    battle.allies
      .filter(bCh => bCh.ch.hp > 0)
      .forEach((bCh, i) => {
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
          if (i === 0) {
            playSoundName('battle_jump');
          }
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
    ).then(async () => {
      showSection(AppSection.BattleUI, true);
      battle.isStarted = true;
      battle.isPaused = false;
      battle.transitioning = false;
      if (template.events?.onBattleStart) {
        await template.events?.onBattleStart(battle);
        setTimeout(() => {
          renderUi();
        }, 1);
      } else {
        await invokeAllChannels(battle);
        battleUnpauseTimers(battle);
      }
    });

    battleSubscribeEvent(battle, BattleEvent.onCompletion, () => {
      stopCurrentMusic(1000);
      if (onCompletion) {
        onCompletion();
      }
    });
    // this timeout is synced with the default battle music
  }, 2550);
};

export const initiateBattle = (
  player: Player,
  template: BattleTemplate
): Battle => {
  const room = getRoom(template.roomName);
  room.characters = [];

  const roomTemplate = getRoomTemplate(template.roomName);
  room.bgImage = roomTemplate.backgroundImage ?? '';
  if (roomTemplate.backgroundTransform) {
    room.bgTransform = Transform.copy(roomTemplate.backgroundTransform);
  }
  const bgTransform = room.bgTransform;
  const restartBgTransform = () => {
    bgTransform.timer = new Timer(bgTransform.timer.duration);
    bgTransform.timer.awaits.push(restartBgTransform);
    bgTransform.timer.start();
  };
  bgTransform.timer.awaits.push(restartBgTransform);
  bgTransform.timer.start();

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
  battle.itemTimer.forceComplete();
  battle.template = template;

  // battle.allies = battle.allies.filter(bCh => bCh.ch.hp > 0);

  battle.allies.forEach(bCh => {
    if (bCh.ch.hp > 0) {
      resetCooldownTimer(bCh, true);
    } else {
      bCh.isDefeated = true;
      bCh.shouldRemove = true;
    }
  });
  battle.enemies.forEach(bCh => {
    resetCooldownTimer(bCh, true);
  });
  battle.alliesStorage.forEach(ally => {
    characterSetFacing(ally.ch, Facing.RIGHT);
  });

  battle.allies.forEach(ally => {
    if (ally.ch.hp > 0) {
      battleCharacterSetAnimationIdle(ally);
    } else {
      characterSetAnimationState(ally.ch, AnimationState.BATTLE_DEAD);
    }
  });

  setCurrentPlayer(player);
  setCurrentBattle(battle);
  setCurrentRoom(room);
  battleSetActorPositions(battle);

  pushKeyHandler(battleKeyHandler);

  // While you are acting, all your characters have their action timers paused.
  // This prevents infinite chaining of attacks when speed is too fast.
  battleSubscribeEvent(
    battle,
    BattleEvent.onTurnStarted,
    (allegiance: BattleAllegiance) => {
      console.log('ON TURN STARTED', allegiance);
      if (allegiance === BattleAllegiance.ALLY) {
        panCameraRelativeToBattleCenter(300, 20, 0);
        battlePauseActionTimers(battle, battle.allies);
      } else {
        panCameraRelativeToBattleCenter(300, -20, 0);
        battlePauseActionTimers(battle, battle.enemies);
      }
    }
  );
  battleSubscribeEvent(
    battle,
    BattleEvent.onTurnEnded,
    (allegiance: BattleAllegiance) => {
      console.log('ON TURN ENDED', allegiance);
      if (allegiance === BattleAllegiance.ALLY) {
        battleUnpauseActionTimers(battle, battle.allies);
        battle.allies.forEach(bCh => {
          bCh.target = undefined;
        });
      } else {
        battleUnpauseActionTimers(battle, battle.enemies);
        battle.enemies.forEach(bCh => {
          bCh.target = undefined;
        });
      }
      if (!sceneIsWaiting(getCurrentScene())) {
        panCameraToBattleCenter(300);
      }
    }
  );

  battleSubscribeEvent(
    battle,
    BattleEvent.onCharacterRecovered,
    (bCh: BattleCharacter) => {
      const [centerPx, centerPy] = characterGetPosCenterPx(bCh.ch);
      roomAddParticle(
        getCurrentRoom(),
        createStatusParticle('Recovery', centerPx, centerPy, colors.BLUE)
      );
      battleCharacterSetAnimationIdle(bCh);
      if (battleGetAllegiance(battle, bCh.ch) === BattleAllegiance.ALLY) {
        playSoundName('battle_recovery');
      }
    }
  );

  if (template.events?.onCharacterDamaged) {
    battleSubscribeEvent(
      battle,
      BattleEvent.onCharacterDamaged,
      template.events?.onCharacterDamaged
    );
  }
  if (template.events?.onTurnEnded) {
    battleSubscribeEvent(
      battle,
      BattleEvent.onTurnEnded,
      template.events?.onTurnEnded
    );
  }
  if (template.events?.onCharacterDefeated) {
    battleSubscribeEvent(
      battle,
      BattleEvent.onCharacterDefeated,
      template.events?.onCharacterDefeated
    );
  }

  console.log('CREATE BATTLE', battle);

  return battle;
};

const getBattleCenterCameraLoc = () => {
  const [screenW, screenH] = getScreenSize();
  return [screenW / 2 - 32 / 2, screenH / 4 - 13];
};
export const panCameraToBattleCenter = (ms: number) => {
  panCameraRelativeToBattleCenter(ms, 0, 0);
};

export const panCameraRelativeToBattleCenter = (
  ms: number,
  x: number,
  y: number
) => {
  const duration = ms;
  const transform = getCameraTransform();
  if (transform) {
    const [tX, tY] = transform.current();
    const [oX, oY] = getBattleCenterCameraLoc();
    const t = new Transform(
      [tX, tY, 0],
      [oX - x, oY - y, 0],
      duration,
      TransformEase.EASE_OUT
    );
    setCameraTransform(t);
  }
};

// used at beginning of fight to start all characters who have an active channel
export const invokeAllChannels = async (battle: Battle) => {
  const enemyChannellers = battle.enemies.filter(bCh => {
    return (
      battleCharacterGetSelectedSkill(bCh).type === BattleActionType.CHANNEL
    );
  });
  const allyChannellers = battle.allies.filter(bCh => {
    return (
      bCh.ch.hp > 0 &&
      battleCharacterGetSelectedSkill(bCh).type === BattleActionType.CHANNEL
    );
  });
  const allChannellers = enemyChannellers.concat(allyChannellers);

  if (allChannellers.length) {
    await timeoutPromise(1000);
  }
  for (let i = 0; i < allChannellers.length; i++) {
    const bCh = allChannellers[i];
    const action = battleCharacterGetSelectedSkill(bCh);
    if (action) {
      await action.cb(battle, bCh);
      bCh.actionTimer.start();
      bCh.actionTimer.pause();
      await timeoutPromise(500);
    }
  }
};

export const callScriptDuringBattle = async (scriptName: string) => {
  const battle = getCurrentBattle();
  if (battle) {
    battle.isPaused = true;
    const keyHandler = pushEmptyKeyHandler();
    hideSections();
    battlePauseTimers(battle);
    disableKeyUpdate();
    await callScript(getCurrentScene(), scriptName);
    battle.isPaused = false;
    enableKeyUpdate();
    popKeyHandler(keyHandler);
    battleUnpauseTimers(battle);
    showSection(AppSection.BattleUI, true);
  }
};

export const createAndCallScriptDuringBattle = async (
  scriptSrc: string,
  showUi = false
) => {
  const battle = getCurrentBattle();
  if (battle) {
    battle.isPaused = true;
    const keyHandler = pushEmptyKeyHandler();
    hideSections();
    battlePauseTimers(battle);
    disableKeyUpdate();
    await createAndCallScript(getCurrentScene(), scriptSrc);
    battle.isPaused = false;
    enableKeyUpdate();
    popKeyHandler(keyHandler);
    battleUnpauseTimers(battle);
    if (showUi) {
      showSection(AppSection.BattleUI, true);
    }
  }
};

export const keyToAllyIndex = (key: string): number | undefined => {
  const keys = {
    x: 0,
    z: 1,
    s: 2,
    a: 3,
    w: 4,
    q: 5,
  };
  return keys[key.toLowerCase()];
};

export const allyIndexToKey = (ind: number): string | undefined => {
  const keys = ['x', 'z', 's', 'a', 'w', 'q'];
  return keys[ind]?.toUpperCase();
};

export const battleKeyHandler = async (ev: KeyboardEvent) => {
  const battle = getCurrentBattle();
  const isPaused = getIsPaused();
  // hack: there's gotta be a better way
  const isOtherMenuOpen = getUiInterface().appState.sections.length > 1;
  if (isOtherMenuOpen) {
    return;
  }

  if (battle.transitioning) {
    return;
  }

  const isBattleKey = /^[xzsawqXZSAWQ]$/.test(ev.key);
  if (!isPaused && isBattleKey) {
    const key = ev.key.toLowerCase();

    const bCh = battle.alliesStorage[keyToAllyIndex(key) ?? -1];

    if (bCh?.ch.hp > 0) {
      const skill = battleCharacterGetSelectedSkill(bCh);
      invokeSkill(bCh, skill);
    }

    return;
  }

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
    // case 'q':
    // case 'Q': {
    //   const bCh = battle.alliesStorage[0];
    //   const particle = createParticleAtCharacter(
    //     {
    //       ...EFFECT_TEMPLATE_DEAD32,
    //     },
    //     bCh.ch
    //   );
    //   roomAddParticle(battle.room, particle);
    //   break;
    // }
    case 'ArrowLeft': {
      if (!isPaused) {
        if (battleCycleMeleeTarget(battle)) {
          playSoundName('menu_select');
        } else {
          playSoundName('menu_cancel');
        }
        renderUi();
      }
      break;
    }
    case 'ArrowRight': {
      if (!isPaused) {
        if (battleCycleRangeTarget(battle)) {
          playSoundName('menu_select');
        } else {
          playSoundName('menu_cancel');
        }
        renderUi();
      }
      break;
    }
    case '0':
    case 'Digit0': {
      // TODO Remove this
      if (!isPaused && battleGetActingAllegiance(battle) === null) {
        battle.enemies.forEach(bCh => {
          applyDamage(battle, bCh, {
            damage: 99999999,
            particleColor: colors.BLACK,
            soundName: 'terminal_beep',
            postfix: '!!!!',
          });
        });
        setTimeout(() => {
          battleInvokeEvent(
            battle,
            BattleEvent.onTurnEnded,
            BattleAllegiance.ALLY
          );
        }, 100);
      }
      break;
    }
    // case 'Tab': {
    //   if (isPaused) {
    //     const uiState = getUiInterface().appState.battle;
    //     const battle = getCurrentBattle();
    //     let nextIndex =
    //       (uiState.characterIndexSelected + 1) % battle.allies.length;
    //     if (nextIndex === -1) {
    //       nextIndex = battle.allies.length - 1;
    //     }
    //     playSoundName('menu_select');
    //     setBattleCharacterIndexSelected(nextIndex);
    //     ev.preventDefault();
    //   }
    //   break;
    // }
    case ' ': {
      if (isPaused) {
        // playSoundName('woosh_reverse');
        // unpause();
      } else {
        playSoundName('woosh');
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

  if (bCh.actionState === BattleActionState.CHANNELING) {
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

  bCh.canActSignaled = false;
  skill.cb(battle, bCh);
  // console.log('INVOKE SKILL', bCh, skill);
  battleInvokeEvent(getCurrentBattle(), BattleEvent.onCharacterAction, bCh);
};

export const beginAction = async (bCh: BattleCharacter): Promise<void> => {
  console.log('begin action', bCh);
  const battle = getCurrentBattle();
  if (battle.isPaused) {
    return;
  }

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

  if (battle.isPaused) {
    return;
  }

  if (battleCharacterIsCasting(bCh) || battleCharacterIsChanneling(bCh)) {
  } else {
    battleCharacterSetActonState(bCh, BattleActionState.ACTING);
    const transform = bCh.ch.transform;
    if (transform) {
      const inverseTransform = transform.createInverse();
      characterSetTransform(bCh.ch, inverseTransform);
      playSoundName('battle_jump');
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
    console.log('NO MORE ALLEGIANCE IS ACTING', defeatedCharacters);
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
        playSoundName('despawn');
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

        // stagger these out bit for a cooler effect
        await timeoutPromise(100);
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

export const didEvade = (
  bCh: BattleCharacter,
  type: BattleDamageType,
  evasionMultiplier: number
) => {
  const battle = getCurrentBattle();
  const evasionRate =
    getEvasionAfterEvasionEffects(
      battle,
      bCh,
      type,
      battleCharacterGetEvasion(bCh)
    ) * evasionMultiplier;
  const randVal = Math.random() * 100;
  const didEvade = randVal <= evasionRate;
  console.log('DID evade?', didEvade, randVal, evasionRate);
  return didEvade;
};

export const applyStaggerDamage = (
  bCh: BattleCharacter,
  staggerDamage: number
) => {
  console.log('apply stagger damage of', staggerDamage, 'to', bCh.ch.name);
  // if (bCh.armor > 0) {
  //   staggerDamage = staggerDamage / 2;
  // }

  if (battleCharacterIsDefeated(bCh)) {
    return;
  }

  if (battleCharacterIsStaggered(bCh)) {
    console.log('bCh is already staggered');
    bCh.staggerTimer.start();
  } else {
    console.log('STAGGER!', bCh.actionState);
    bCh.staggerGauge.fill(staggerDamage);
    if (bCh.staggerGauge.isFull()) {
      bCh.canActSignaled = false;
      if (bCh.staggerSoundName) {
        console.log('PLAY STAGGER SOUND', bCh.staggerSoundName);
        playSoundName(bCh.staggerSoundName);
      } else {
        console.error('NO STAGGER SOUND SPECIFIED FOR BCH', bCh);
      }
      interruptCast(bCh);
      interruptChannel(bCh);
      if (bCh.armor) {
        applyArmorDamage(getCurrentBattle(), bCh, 1, true);
        bCh.armor = 0;
      }
      battleInvokeEvent(
        getCurrentBattle(),
        BattleEvent.onCharacterStaggered,
        bCh
      );
      battleCharacterSetActonState(bCh, BattleActionState.STAGGERED);
      bCh.staggerTimer.start();
      bCh.staggerGauge.empty();
      bCh.actionTimer.start();
      bCh.actionTimer.pause();

      // This particle makes a lot of visual noise...
      const [centerPx, centerPy] = characterGetPosCenterPx(bCh.ch);
      roomAddParticle(
        getCurrentRoom(),
        createStatusParticle('Staggered', centerPx, centerPy, 'orange')
      );
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
    if (victim.armor > 0) {
      playSoundName('battle_armor_broken');
      victim.armor--;
      armorReduced = true;
    }
    nextDamageAmount = 0;
  } else if (victim.armorTimer.isComplete()) {
    playSoundName('battle_armor_hit');
    victim.armorTimer.start();
    nextDamageAmount = 0;
  } else {
    console.log('BROKE ARMOR WITH SIMULTANEOUS ATTACK!');
    if (victim.armor > 0) {
      playSoundName('battle_armor_broken');
      victim.armor--;
      armorReduced = true;
    }
    if (victim.armor > 0) {
      // nextDamageAmount = 0;
    }
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

export const applyKnockDown = (victim: BattleCharacter) => {
  battleInvokeEvent(
    getCurrentBattle(),
    BattleEvent.onCharacterKnockedDown,
    victim
  );
  battleCharacterSetActonState(victim, BattleActionState.KNOCKED_DOWN);
  victim.koTimer.start();
  victim.staggerTimer.start();
  victim.staggerGauge.empty();
  victim.actionTimer.start();
  victim.actionTimer.pause();
  characterSetAnimationState(victim.ch, AnimationState.BATTLE_KNOCKED_DOWN);
  const [centerPx, centerPy] = characterGetPosCenterPx(victim.ch);
  roomAddParticle(
    getCurrentRoom(),
    createStatusParticle('Knockdown!', centerPx, centerPy, 'red')
  );
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
): boolean => {
  const { damage: baseDamage, staggerDamage } = args;

  let particleColor = colors.WHITE;
  let particlePostfix = '';
  const maxDamage = baseDamage + attacker.ch.stats.POW;
  const minDamage = maxDamage - Math.ceil(maxDamage / 4);
  let damage = Math.floor(getRandBetween(minDamage, maxDamage));
  let soundName = '';

  if (battleCharacterIsStaggered(victim)) {
    damage *= 2;
    particleColor = colors.BLUE;
    particlePostfix = '!';
    // TODO make this configurable
    soundName = 'robot_staggered_damaged';

    if (
      args.attackType === SwingType.KNOCK_DOWN &&
      !battleCharacterIsKnockedDown(victim)
    ) {
      applyKnockDown(victim);
    }
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
    interruptChannel(victim);
  }

  // TODO Finishers

  // TODO Damage Reduction

  damage = getDamageAfterDamageEffects(
    battle,
    victim,
    BattleDamageType.SWING,
    Math.max(0, damage)
  );
  console.log('APPLY SWING DAMAGE', damage);

  applyDamage(battle, victim, {
    damage,
    particleColor,
    postfix: particlePostfix,
    soundName,
  });
  return true;
};

export const applyRangeDamage = (
  battle: Battle,
  attacker: BattleCharacter,
  victim: BattleCharacter,
  baseDamage: number,
  staggerDamage: number
): boolean => {
  let particlePostfix = '';
  let particleColor = colors.WHITE;
  const maxDamage = baseDamage + Math.floor(attacker.ch.stats.POW / 2);
  const minDamage = maxDamage - Math.ceil(maxDamage / 4);
  let damage = Math.floor(getRandBetween(minDamage, maxDamage));
  let soundName = '';

  if (battleCharacterIsStaggered(victim)) {
    particlePostfix = '!';
    particleColor = colors.ORANGE;
    damage *= 2;
    soundName = 'robot_staggered_damaged';
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
  if (victim.armor <= 0) {
    interruptCast(victim);
    interruptChannel(victim);
  }

  // TODO Evasion

  // TODO Pinned

  damage = getDamageAfterDamageEffects(
    battle,
    victim,
    BattleDamageType.RANGED,
    Math.max(0, damage)
  );
  applyDamage(battle, victim, {
    damage,
    particleColor,
    soundName,
    postfix: particlePostfix,
  });
  return true;
};

export const applyMagicDamage = (
  battle: Battle,
  attacker: BattleCharacter,
  victim: BattleCharacter,
  baseDamage: number,
  staggerDamage: number
): boolean => {
  let particlePostfix = '';
  let soundName = '';

  const maxDamage = baseDamage + attacker.ch.stats.POW;
  const minDamage = maxDamage - Math.ceil(maxDamage / 4);
  let damage = Math.floor(getRandBetween(minDamage, maxDamage));

  if (battleCharacterIsStaggered(victim)) {
    particlePostfix = '!';
    damage *= 2;
    soundName = 'robot_staggered_damaged';
  } else if (victim.armor > 0) {
    applyArmorDamage(battle, victim, damage, false);
  }
  applyStaggerDamage(victim, staggerDamage);

  interruptCast(victim);
  interruptChannel(victim);

  // TODO Magic Shield

  // TODO Evasion

  // TODO Pinned

  damage = getDamageAfterDamageEffects(
    battle,
    victim,
    BattleDamageType.MAGIC,
    Math.max(0, damage)
  );
  applyDamage(battle, victim, {
    damage,
    particleColor: colors.LIGHTBLUE,
    postfix: particlePostfix,
    soundName,
  });
  return true;
};

export const resetCooldownTimer = (
  bCh: BattleCharacter,
  isAtStartOfBattle?: boolean
) => {
  const skill = bCh.ch.skills[bCh.ch.skillIndex];
  const speed = bCh.ch.stats.SPD;
  let cooldown = skill?.cooldown ?? 1000;
  if (isAtStartOfBattle && bCh.ch.startingCooldown !== undefined) {
    cooldown = bCh.ch.startingCooldown;
  }

  if (skill) {
    // taken from calc for ability haste
    // https://www.reddit.com/r/leagueoflegends/comments/i5m8m6/i_made_a_chart_to_convert_cdr_to_ability_haste/
    const cdr = 1 - 1 / (1 + speed / 100);
    // all skills must have a cooldown of at least 1 second
    let newTime = Math.max(cooldown - cooldown * cdr, 1000);

    if (battleCharacterHasStatus(bCh, BattleStatus.HASTE)) {
      newTime = newTime / 2;
    }

    console.log('RESET COOLDOWN TIMER', bCh.ch.name, newTime, cdr, speed);
    bCh.actionTimer.start(newTime);
    if (
      battleCharacterIsStaggered(bCh) ||
      battleCharacterIsChanneling(bCh) ||
      battleCharacterIsCasting(bCh)
    ) {
      bCh.actionTimer.pause();
    }
  }
};

export const setCasting = (
  bCh: BattleCharacter,
  castArgs: {
    castTime: number;
    soundName?: string;
    onCast?: () => Promise<void>;
    onInterrupt?: () => Promise<void>;
  }
) => {
  battleCharacterSetActonState(bCh, BattleActionState.CASTING);
  characterSetAnimationState(bCh.ch, AnimationState.BATTLE_CAST);
  battleInvokeEvent(getCurrentBattle(), BattleEvent.onCharacterCasting, bCh);
  if (castArgs.soundName) {
    playSoundName(castArgs.soundName);
  } else {
    playSoundName('battle_cast');
  }

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
    console.log('INTERRUPT CAST', bCh);
    battleCharacterSetActonState(bCh, BattleActionState.IDLE);
    battleInvokeEvent(
      getCurrentBattle(),
      BattleEvent.onCharacterInterrupted,
      bCh
    );
    bCh.onCastInterrupted();
    const [centerPx, centerPy] = characterGetPosCenterPx(bCh.ch);
    bCh.actionTimer.unpause();
    resetCooldownTimer(bCh);

    playSoundName('battle_interrupt_channel');
    roomAddParticle(
      getCurrentRoom(),
      createStatusParticle('Interrupt!', centerPx, centerPy, 'cyan')
    );
  }
};

export const interruptChannel = (bCh: BattleCharacter) => {
  if (battleCharacterIsChanneling(bCh)) {
    console.log('INTERRUPT CHANNEL', bCh);
    battleCharacterSetActonState(bCh, BattleActionState.IDLE);
    battleInvokeEvent(
      getCurrentBattle(),
      BattleEvent.onCharacterInterrupted,
      bCh
    );
    bCh.onChannelInterrupted();
    const [centerPx, centerPy] = characterGetPosCenterPx(bCh.ch);
    bCh.actionTimer.start();
    bCh.actionTimer.unpause();

    playSoundName('battle_interrupt_channel');
    roomAddParticle(
      getCurrentRoom(),
      createStatusParticle('Interrupt!', centerPx, centerPy, 'teal')
    );
  }
};

export const completeCast = async (bCh: BattleCharacter) => {
  const battle = getCurrentBattle();
  const actingAllegiance = battleGetActingAllegiance(battle);
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

export const applyMiss = (battle: Battle, bCh: BattleCharacter) => {
  console.log('apply miss to', bCh.ch.name);
  const currentAnim = characterGetAnimation(bCh.ch);
  currentAnim.disableSounds();
  timeoutPromise(150).then(() => currentAnim.enableSounds());
  playSoundName('battle_evasion');
  const [centerPx, centerPy] = characterGetPosCenterPx(bCh.ch);
  roomAddParticle(
    battle.room,
    createDamageParticle(`Miss!`, centerPx, centerPy, colors.WHITE)
  );

  characterSetAnimationState(bCh.ch, AnimationState.BATTLE_EVADED);
  characterOnAnimationCompletion(bCh.ch, () => {
    battleCharacterSetAnimationIdle(bCh);
  });
  battleInvokeEvent(getCurrentBattle(), BattleEvent.onCharacterEvaded, bCh);
};

export const applyDamage = (
  battle: Battle,
  bCh: BattleCharacter,
  params: {
    damage: number;
    particleColor: string;
    soundName?: string;
    postfix?: string;
  }
): void => {
  const { damage: dmg, particleColor, postfix, soundName } = params;
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
    battleInvokeEvent(battle, BattleEvent.onCharacterDamaged, bCh);
  }

  if (bCh.isDefeated) {
    const [centerPx, centerPy] = characterGetPosCenterPx(bCh.ch);
    roomAddParticle(
      battle.room,
      createWeightedParticle(EFFECT_TEMPLATE_GEM, centerPx, centerPy, 1000)
    );
  } else if (bCh.ch.hp > 0 && soundName) {
    playSoundName(soundName);
  }

  battleCharacterSetAnimationStateAfterTakingDamage(bCh);
};

export const getDamageAfterDamageEffects = (
  battle: Battle,
  victim: BattleCharacter,
  type: BattleDamageType,
  damage: number
) => {
  const damageEffects = battleGetPersistentEffects(
    battle,
    PersistentEffectEvent.onBeforeCharacterDamaged,
    battleGetAllegiance(battle, victim.ch)
  );
  for (let i = 0; i < damageEffects.length; i++) {
    const damageEffect = damageEffects[
      i
    ] as PersistentEffectEventParams<OnBeforeCharacterDamagedCb>;
    const nextDamage = damageEffect.cb(victim, damage, type);
    if (nextDamage !== undefined) {
      damage = nextDamage;
    }
  }
  return Math.max(0, damage);
};

export const getEvasionAfterEvasionEffects = (
  battle: Battle,
  victim: BattleCharacter,
  type: BattleDamageType,
  evasion: number
) => {
  const evasionEffects = battleGetPersistentEffects(
    battle,
    PersistentEffectEvent.onBeforeCharacterEvades,
    battleGetAllegiance(battle, victim.ch)
  );
  for (let i = 0; i < evasionEffects.length; i++) {
    const evasionEffect = evasionEffects[
      i
    ] as PersistentEffectEventParams<OnBeforeCharacterDamagedCb>;
    const nextEvasion = evasionEffect.cb(victim, evasion, type);
    if (nextEvasion !== undefined) {
      evasion = nextEvasion;
    }
  }
  evasion = Math.max(0, evasion);
  evasion = Math.min(95, evasion);
  return evasion;
};

export const getReturnToOverworldBattleCompletionCB = (
  oldRoom: Room,
  leaderPos: Point3d,
  leaderFacing: Facing,
  template: BattleTemplate,
  roamer?: Character
) => {
  let musicPlaybackPosition = 0;
  const currentMusic = getCurrentMusic();
  if (currentMusic) {
    musicPlaybackPosition = musicGetCurrentPlaybackPosition(currentMusic);
  }
  stopCurrentMusic();

  return () => {
    console.log('BATTLE COMPLETED!');
    fadeOut(500, true);
    timeoutPromise(500).then(() => {
      setCameraTransform(null);
      fadeIn(500, true);
      setCurrentBattle(null);
      setCurrentRoom(oldRoom);
      showSection(AppSection.Debug, true);
      overworldShow(getCurrentOverworld());
      const player = getCurrentPlayer();
      characterSetPos(player.leader, leaderPos);
      characterSetFacing(player.leader, leaderFacing);
      player.partyStorage.forEach(ch => {
        characterSetTransform(ch, null);
      });

      if (roamer) {
        const roamerName = roamer.name;
        const scene = getCurrentScene();
        sceneSetEncounterDefeated(scene, roamerName, oldRoom.name);
      }

      if (currentMusic) {
        playMusic(getCurrentOverworld().music, true);
        if (currentMusic.soundName === getCurrentOverworld().music) {
          musicSetPlaybackPosition(currentMusic, musicPlaybackPosition);
        }
      }

      if (template.events?.onAfterBattleEnded) {
        template.events?.onAfterBattleEnded();
      }
    });
  };
};

const checkBattleCompletion = async (battle: Battle) => {
  if (battleIsVictory(battle)) {
    hideSections();
    battle.isCompleted = true;
    popKeyHandler(battleKeyHandler);
    battlePauseActionTimers(battle);
    // HACK: last enemy remains without this for some reason
    if (battle.template?.events?.onBattleEnd) {
      await battle.template?.events?.onBattleEnd(battle);
    }

    console.log('VICTORY');
    stopCurrentMusic(250);
    playSoundName('fanfare');
    hideSections();
    timeoutPromise(2800).then(() => {
      panCameraRelativeToPlayer(70, 20, 500, true);

      playMusic('music_battle_victory', true);
      showSection(AppSection.BattleVictory, true);
    });
    await timeoutPromise(250);
    for (const i in battle.allies) {
      characterSetAnimationState(
        battle.allies[i].ch,
        AnimationState.BATTLE_FLOURISH
      );
    }
  } else if (battleIsLoss(battle)) {
    // HACK: If Ada is last character to die, the on turn end callback does not get called
    // which sets the character's dead anim status
    characterSetAnimationState(
      getCurrentPlayer().leader,
      AnimationState.BATTLE_DEAD
    );
    hideSections();
    playSoundName('battle_loss');
    battle.isCompleted = true;
    popKeyHandler(battleKeyHandler);
    battlePauseActionTimers(battle);
    await timeoutPromise(100);
    console.log('DEFEAT!');
    showSection(AppSection.BattleDefeated, true);
  }
};

export const fleeBattle = (battle: Battle) => {
  if (battle.template?.disableFlee) {
    console.error('Cannot flee a battle which has flee disabled.');
    return;
  }

  hideSections();
  battle.isCompleted = true;
  battle.transitioning = true;
  popKeyHandler(battleKeyHandler);
  battlePauseActionTimers(battle);
  stopCurrentMusic();

  const jumpTimeMs = 500;
  const jumpTimeMsPostLag = 500;
  const jumpTimeMsStaggered = 250;
  battle.allies
    .filter(bCh => bCh.ch.hp > 0)
    .forEach((bCh, i) => {
      const startPoint = characterGetPos(bCh.ch);
      const endPoint = [
        startPoint[0] - 16 * 6,
        startPoint[1] + 16 * 6,
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
        if (i === 0) {
          playSoundName('battle_jump');
        }
        characterSetAnimationState(bCh.ch, AnimationState.BATTLE_JUMP);
        bCh.ch.transform?.timer.unpause();
      });
    });

  timeoutPromise(
    jumpTimeMs +
      (500 + battle.allies.length * jumpTimeMsStaggered) +
      jumpTimeMsPostLag
  ).then(async () => {
    battle.isStarted = true;
    battle.isPaused = false;
    battle.transitioning = false;
    battleInvokeEvent(battle, BattleEvent.onCompletion, battle);
  });
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

  battle.itemTimer.update();

  if (!battle.isCompleted) {
    checkBattleCompletion(battle);
  }
};
