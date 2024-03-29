/* @jsx h */
import { h } from 'preact';

import { createParticleAtCharacter } from 'controller/battle-actions';
import {
  applyArmorDamage,
  resetCooldownTimer,
} from 'controller/battle-management';
import { popKeyHandler, pushEmptyKeyHandler } from 'controller/events';
import { pause, unpause } from 'controller/loop';
import {
  callScript,
  spawnParticleAtCharacter,
} from 'controller/scene/scene-commands';
import {
  hideBattleEffect,
  hideModal,
  showBattleEffect,
  showCharacterFollowerSelectModal,
  showModal,
  showPartyMemberSelectModal,
} from 'controller/ui-actions';
import {
  battleGetAllegiance,
  battleGetBattleCharacterFromCharacter,
  battlePauseTimers,
  BattleStatus,
} from 'model/battle';
import {
  BattleCharacter,
  battleCharacterAddStatus,
  battleCharacterIsKnockedDown,
  battleCharacterRecoverFromKnockDown,
  battleCharacterSetActonState,
  battleCharacterSetAnimationIdle,
} from 'model/battle-character';
import { getCtx } from 'model/canvas';
import {
  AnimationState,
  Character,
  characterAddItemStatus,
  characterGetAnimation,
  characterGetPosCenterPx,
  characterHasAnimationState,
  characterModifyHp,
  characterRemoveItemStatus,
  characterSetAnimationState,
  characterSetItemStatusState,
  ItemStatus,
} from 'model/character';
import {
  disablePauseRendering,
  enablePauseRendering,
  getCurrentBattle,
  getCurrentPlayer,
  getIsPaused,
} from 'model/generics';
import {
  createDamageParticle,
  createStatusParticle,
  EFFECT_TEMPLATE_DEAD32,
} from 'model/particle';
import { playerGetItemCount, playerRemoveItem } from 'model/player';
import { roomAddParticle, roomRemoveParticle } from 'model/room';
import { playSoundName } from 'model/sound';
import { ModalSection } from 'model/store';
import { timeoutPromise } from 'utils';
import UseItemDescription from 'view/components/UseItemDescription';
import { clearScreen } from 'view/draw';
import { colors } from 'view/style';
import { renderUi } from 'view/ui';
import { ItemTemplate, ItemType, Item } from '.';
import { get as getPEffect } from '../persistent-effects';

const assertPlayerHasItem = (itemName: string) => {
  return playerGetItemCount(getCurrentPlayer(), itemName) > 0;
};
export const showBattleParticles = async (
  ch: Character,
  effectName: string,
  text?: string
) => {
  return new Promise(resolve => {
    const battle = getCurrentBattle();
    const bCh = battleGetBattleCharacterFromCharacter(battle, ch);
    if (bCh) {
      hideModal();
      // this needs to be a loop anim because of how AnimDiv works (crappily)
      showBattleEffect([bCh], effectName);
      enablePauseRendering();

      let textParticle: any = null;
      if (text) {
        const [centerPx, centerPy] = characterGetPosCenterPx(bCh.ch);
        const particle = createStatusParticle(
          `${text}`,
          centerPx,
          centerPy,
          colors.LIGHTGREEN
        );
        roomAddParticle(battle.room, particle);
        textParticle = particle;
      }

      setTimeout(() => {
        battleCharacterSetAnimationIdle(bCh);
        resetCooldownTimer(bCh);
        battlePauseTimers(battle, [bCh]);
        // HACK I'm guessing it doesn't reset the timestamp if it's already paused but
        // I don't really care to find out
        bCh.actionTimer.timestampPause = bCh.actionTimer.timestampStart;
        characterGetAnimation(bCh.ch).pause();
        hideBattleEffect();
        if (textParticle) {
          roomRemoveParticle(battle.room, textParticle);
        }

        // HACK at least one render has to remove the particles...
        setTimeout(() => {
          disablePauseRendering();
        }, 100);
        resolve(true);
      }, 1500);
    }
  });
};

interface ICreateSelectPartyMemberCallMeta {
  isBattle?: boolean;
  filter: (ch: Character) => boolean;
  onCharacterSelectedMenu: (ch: Character) => void;
  onCharacterSelectedBattle: (ch: Character) => void;
}

export const createSelectPartyMemberCall = (
  item: Item,
  resolve: (v: boolean) => void,
  {
    isBattle,
    filter,
    onCharacterSelectedMenu,
    onCharacterSelectedBattle,
  }: ICreateSelectPartyMemberCallMeta
) => {
  showPartyMemberSelectModal({
    showDelayInfo: true,
    itemNameForDescription: item.name as string,
    body: UseItemDescription,
    onCharacterSelected: async (ch: Character) => {
      if (!assertPlayerHasItem(item.name as string)) {
        playSoundName('terminal_cancel');
        return;
      }
      if (isBattle) {
        onCharacterSelectedBattle(ch);
        hideModal();
        resolve(true);
      } else {
        onCharacterSelectedMenu(ch);
      }
    },
    onClose: () => resolve(false),
    filter,
  });
};

// onClose: () => void;
// onCharacterSelected: (ch: Character) => Promise<void>;
// filter?: (a: any) => boolean;
// body?: any;
// characters: Character[];
// isAll?: boolean;

export const createSelectEnemyCall = (
  item: Item,
  resolve: (v: boolean) => void,
  { filter, onCharacterSelectedBattle }: ICreateSelectPartyMemberCallMeta
) => {
  const battle = getCurrentBattle();
  // HACK this removes the item select dialog without actually removing it.
  showBattleEffect([], '');
  showCharacterFollowerSelectModal({
    body: `Use ${item.label} on which character?`,
    isAll: false,
    characters: battle.enemies.map(bCh => bCh.ch),
    onCharacterSelected: async (ch: Character) => {
      if (!assertPlayerHasItem(item.name as string)) {
        playSoundName('terminal_cancel');
        return;
      }
      enablePauseRendering();
      onCharacterSelectedBattle(ch);
      hideModal();
    },
    onClose: () => {
      hideModal();
      hideBattleEffect();
      resolve(false);
    },
    filter,
  });
};

export const createConfirmUseModal = (
  item: Item,
  resolve: (v: boolean) => void
) => {
  const emptyStackCb = pushEmptyKeyHandler();
  showModal(ModalSection.CONFIRM, {
    onClose: () => {
      resolve(false);
      popKeyHandler(emptyStackCb);
    },
    onConfirm: () => {
      resolve(true);
      popKeyHandler(emptyStackCb);
    },
    body: (
      <div>
        Are you sure you wish to use:{' '}
        <span style={{ color: colors.BLUE }}>{item.label}</span>?
        <div
          style={{
            margin: '12px 0px',
            color: colors.LIGHTGREY,
          }}
        >
          {item?.effectDescription}
        </div>
      </div>
    ),
  });
};

export const createPartyMemberSelectOnUseCb = (
  particleName: string,
  particleText: string,
  applyItem: (ch: Character, item: Item) => void,
  filter?: any
): ((item: Item, isBattle?: boolean) => Promise<boolean>) => {
  return async (item: Item, isBattle?: boolean) => {
    return new Promise(resolve => {
      createSelectPartyMemberCall(item, resolve, {
        isBattle,
        filter: filter ?? (ch => ch.hp > 0),
        onCharacterSelectedMenu: (ch: Character) => {
          applyItem(ch, item);
        },
        onCharacterSelectedBattle: (ch: Character) => {
          applyItem(ch, item);
          showBattleParticles(ch, particleName, particleText);
        },
      });
    });
  };
};

export const createEnemySelectOnUseCb = (
  particleName: string,
  particleText: string,
  applyItem: (chList: Character[], item: Item) => void,
  filter?: any
): ((item: Item, isBattle?: boolean) => Promise<boolean>) => {
  return async (item: Item, isBattle?: boolean) => {
    return new Promise(resolve => {
      createSelectEnemyCall(item, resolve, {
        filter: filter ?? (ch => true),
        onCharacterSelectedMenu: () => {},
        onCharacterSelectedBattle: (ch: Character) => {
          applyItem([ch], item);
          showBattleParticles(ch, particleName, particleText).then(() =>
            resolve(true)
          );
        },
      });
    });
  };
};

export const createRezOnUseCb = (
  particleName: string,
  particleText: string,
  applyItem: (ch: Character, item: Item) => void
): ((item: Item, isBattle?: boolean) => Promise<boolean>) => {
  return async (item: Item, isBattle?: boolean) => {
    return new Promise(resolve => {
      createSelectPartyMemberCall(item, resolve, {
        isBattle,
        filter: ch => ch.hp === 0,
        onCharacterSelectedMenu: (ch: Character) => {
          applyItem(ch, item);

          hideModal();
          resolve(true);
        },
        onCharacterSelectedBattle: (ch: Character) => {
          applyItem(ch, item);

          const battle = getCurrentBattle();
          const bCh = battleGetBattleCharacterFromCharacter(battle, ch);
          if (bCh) {
            bCh.isDefeated = false;
            bCh.shouldRemove = false;
            if (!battle.allies.includes(bCh)) {
              battle.allies.push(bCh);
            }
          }
          showBattleParticles(ch, particleName, particleText);

          // have to use setTimeout here because timeoutPromise does not operate when paused,
          // and all items must be used while paused
          setTimeout(() => {
            const battle = getCurrentBattle();
            const bCh = battleGetBattleCharacterFromCharacter(battle, ch);
            if (bCh) {
              if (
                characterHasAnimationState(ch, AnimationState.BATTLE_REVIVE)
              ) {
                characterSetAnimationState(ch, AnimationState.BATTLE_REVIVE);
              } else {
                battleCharacterSetAnimationIdle(bCh);
                characterGetAnimation(bCh.ch).pause();
              }
            }
          }, 1000);
        },
      });
    });
  };
};

export const createOverworldStatusOnUseCb = (
  applyItem: (item: Item) => void
): ((item: Item, isBattle?: boolean) => Promise<boolean>) => {
  return async (item: Item, isBattle?: boolean) => {
    return new Promise(resolve => {
      if (isBattle) {
        resolve(false);
      }
      createConfirmUseModal(item, r => {
        if (r) {
          applyItem(item);
        }
        resolve(r);
      });
    });
  };
};

export const init = (exp: { [key: string]: ItemTemplate }) => {
  exp.DilutedPotion = {
    label: 'Diluted HP Potion',
    sortName: '0PotionHP',
    description:
      'This bottle contains a green-ish liquid that, when imbibed, restores a rather uninspiring amount of HP.',
    effectDescription: 'Restore 10 hp.',
    type: ItemType.USABLE,
    icon: 'potion',
    onUse: createPartyMemberSelectOnUseCb(
      'effect_heal_anim_loop',
      '+10',
      (ch: Character, item: Item) => {
        playSoundName('use_item');
        characterModifyHp(ch, 10);
        playerRemoveItem(getCurrentPlayer(), item.name as string);
      }
    ),
  };
  exp.FeeblePotion = exp.DilutedPotion;
  exp.Potion = {
    label: 'Standard HP Potion',
    sortName: '1PotionHP',
    description:
      'This bottle contains a green liquid that, when imbibed, restores a standard amount of HP.',
    effectDescription: 'Restore 25 hp.',
    type: ItemType.USABLE,
    icon: 'potion',
    onUse: createPartyMemberSelectOnUseCb(
      'effect_heal_anim_loop',
      '+10',
      (ch: Character, item: Item) => {
        playSoundName('use_item');
        characterModifyHp(ch, 25);
        playerRemoveItem(getCurrentPlayer(), item.name as string);
      }
    ),
  };

  exp.StrongPotion = {
    label: 'Strong HP Potion',
    sortName: '2PotionHP',
    description:
      'This bottle contains a green liquid that, when imbibed, restores a large amount of HP.',
    effectDescription: 'Restore 50 hp.',
    type: ItemType.USABLE,
    icon: 'potion',
    onUse: createPartyMemberSelectOnUseCb(
      'effect_heal_anim_loop',
      '+50',
      (ch: Character, item: Item) => {
        playSoundName('use_item');
        characterModifyHp(ch, 50);
        playerRemoveItem(getCurrentPlayer(), item.name as string);
      }
    ),
  };

  exp.DoubleStrongPotion = {
    label: 'Double Strong HP Potion',
    sortName: '3PotionHP',
    description:
      'This bottle contains a green liquid that, when imbibed, restores a doubly-large amount of HP.',
    effectDescription: 'Restore 100 hp.',
    type: ItemType.USABLE,
    icon: 'potion',
    onUse: createPartyMemberSelectOnUseCb(
      'effect_heal_anim_loop',
      '+100',
      (ch: Character, item: Item) => {
        playSoundName('use_item');
        characterModifyHp(ch, 100);
        playerRemoveItem(getCurrentPlayer(), item.name as string);
      }
    ),
  };

  exp.RezGem = {
    label: 'Quartz Respawn Gem',
    sortName: '0RespawnGem',
    description:
      'This small gem is used to restore a character who has had their HP reduced to zero.',
    effectDescription: 'Revive character with 5 hp.',
    type: ItemType.USABLE,
    icon: 'mineralHeart',
    onUse: createRezOnUseCb(
      'effect_heal_anim_loop',
      'Revive!',
      (ch: Character, item: Item) => {
        playSoundName('rez');
        characterModifyHp(ch, 5);
        playerRemoveItem(getCurrentPlayer(), item.name as string);
      }
    ),
  };
  exp.QuartzRezGem = exp.RezGem;

  exp.AmberGem = {
    label: 'Amber Respawn Gem',
    sortName: '1RespawnGem',
    description:
      'This small gem is used to restore a character who has had their HP reduced to zero.',
    effectDescription: 'Revive character with 25 hp.',
    type: ItemType.USABLE,
    icon: 'mineralHeart',
    onUse: createRezOnUseCb(
      'effect_heal_anim_loop',
      'Revive!',
      (ch: Character, item: Item) => {
        playSoundName('rez');
        characterModifyHp(ch, 25);
        playerRemoveItem(getCurrentPlayer(), item.name as string);
      }
    ),
  };

  exp.TopazGem = {
    label: 'Topaz Respawn Gem',
    sortName: '2RespawnGem',
    description:
      'This small gem is used to restore a character who has had their HP reduced to zero.',
    effectDescription: 'Revive character with 50 hp.',
    type: ItemType.USABLE,
    icon: 'mineralHeart',
    onUse: createRezOnUseCb(
      'effect_heal_anim_loop',
      'Revive!',
      (ch: Character, item: Item) => {
        playSoundName('rez');
        characterModifyHp(ch, 50);
        playerRemoveItem(getCurrentPlayer(), item.name as string);
      }
    ),
  };

  exp.Muffin = {
    label: 'Muffin',
    sortName: 'Muffin',
    description:
      'This tasty snack is just the right thing to put somebody back on their feet.',
    effectDescription:
      'Remove the "Knocked Down" status for an allied character.',
    type: ItemType.USABLE_BATTLE,
    icon: 'muffin',
    onUse: createPartyMemberSelectOnUseCb(
      'effect_heal_anim_loop',
      '',
      (ch: Character, item: Item) => {
        battleCharacterRecoverFromKnockDown(
          battleGetBattleCharacterFromCharacter(
            getCurrentBattle(),
            ch
          ) as BattleCharacter,
          getCurrentBattle()
        );
        playerRemoveItem(getCurrentPlayer(), item.name as string);
      },
      (ch: Character) =>
        ch.hp > 0 &&
        getCurrentBattle() &&
        battleCharacterIsKnockedDown(
          battleGetBattleCharacterFromCharacter(
            getCurrentBattle(),
            ch
          ) as BattleCharacter
        )
    ),
  };

  exp.DilutedAcidicCompound = {
    label: 'Diluted Acidic Compound',
    description:
      "A flask of some nasty-smelling liquid that supposedly can eat through one's armor.",
    effectDescription: 'Remove 1 point of armor from target.',
    type: ItemType.USABLE_BATTLE,
    icon: 'flask',
    onUse: createEnemySelectOnUseCb(
      '',
      'Acid',
      (characters: Character[], item: Item) => {
        const ch = characters[0];
        const battle = getCurrentBattle();
        if (battle) {
          const bCh = battleGetBattleCharacterFromCharacter(battle, ch);
          if (bCh) {
            applyArmorDamage(battle, bCh, 1, true);
            playerRemoveItem(getCurrentPlayer(), item.name as string);
          }
        }
      }
    ),
  };

  exp.DeVisibleCloak = {
    label: 'DeVisible Cloak',
    description:
      'In the early days of the Regem Ludos VR, players were forced to engage in any battle they encountered, since enemies were known to tenaciously chase players down when spotted.  Ostensibly this irritated Mr. Charles DeVisible, who spent months hacking a certain item into the world that would cloak himself from vision.  When other players caught Mr. DeVisible using this item to bypass challenges in VR, they sought to copy the item.  <br/><br/>And copy it they most certainly did.  <br/><br/>While Mr. DeVisible probably still holds the original version of the DeVisible Cloak, a copious number of copies of it can be found littered all about the various floors of the Regem Ludos VR, and they all serve the same purpose: to bypass encounters.  Unfortunately, these copies are not perfect.  For some reason they only last for a limited time before the cloak inexplicably disintegrates, leaving the wearer quite vulnerable.',
    effectDescription: `Apply the ${
      getPEffect('CLOAKED').name
    } effect for 30 seconds: ${getPEffect('CLOAKED').description}`,
    type: ItemType.USABLE_OVERWORLD,
    icon: 'cloakConsume',
    onUse: createOverworldStatusOnUseCb((item: Item) => {
      playSoundName('use_item');
      const player = getCurrentPlayer();
      const leader = player.leader;
      characterAddItemStatus(leader, ItemStatus.CLOAKED);
      playerRemoveItem(getCurrentPlayer(), item.name as string);
      timeoutPromise(30000 - 5000).then(() => {
        characterSetItemStatusState(leader, ItemStatus.CLOAKED, 'expiring');
      });
      timeoutPromise(30000).then(() => {
        characterRemoveItemStatus(leader, ItemStatus.CLOAKED);
      });
    }),
  };
  exp.DeVisibleCloakCutscene = {
    ...exp.DeVisibleCloak,
    name: 'DeVisibleCloak',
    onAcquire: async (item: Item) => {
      callScript('floor1-tut-DeVisibleCloakCutscene');
    },
  };

  exp.HasteFlavoring = {
    label: 'Haste Flavoring',
    description:
      'This viscous, red "flavoring" is used to decrease the cooldowns of abilities while in a Regem Ludos VR Battle.  Even though it looks suspiciously like ketchup, nobody can actually taste anything while in VR, so the substance cannot be confirmed.',
    effectDescription: `While in battle, apply the ${
      getPEffect('HASTE').name
    } effect to one character:  ${getPEffect('HASTE').description}`,
    type: ItemType.USABLE_BATTLE,
    icon: 'potion',
    onUse: createPartyMemberSelectOnUseCb(
      'effect_heal_anim_loop',
      'Haste',
      (ch: Character, item: Item) => {
        const battle = getCurrentBattle();
        if (battle) {
          const bCh = battleGetBattleCharacterFromCharacter(battle, ch);
          if (bCh) {
            playSoundName('use_item');
            battleCharacterAddStatus(bCh, BattleStatus.HASTE, 10000);
            playerRemoveItem(getCurrentPlayer(), item.name as string);
          }
        }
      }
    ),
  };
};
