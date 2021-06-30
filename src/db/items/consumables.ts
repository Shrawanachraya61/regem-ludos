import { createParticleAtCharacter } from 'controller/battle-actions';
import { resetCooldownTimer } from 'controller/battle-management';
import { pause, unpause } from 'controller/loop';
import { spawnParticleAtCharacter } from 'controller/scene-commands';
import {
  hideBattleEffect,
  hideModal,
  showBattleEffect,
  showModal,
  showPartyMemberSelectModal,
} from 'controller/ui-actions';
import {
  battleGetBattleCharacterFromCharacter,
  battlePauseTimers,
} from 'model/battle';
import {
  battleCharacterSetActonState,
  battleCharacterSetAnimationIdle,
} from 'model/battle-character';
import { getCtx } from 'model/canvas';
import {
  AnimationState,
  Character,
  characterGetAnimation,
  characterHasAnimationState,
  characterModifyHp,
  characterSetAnimationState,
} from 'model/character';
import {
  disablePauseRendering,
  enablePauseRendering,
  getCurrentBattle,
  getCurrentPlayer,
  getIsPaused,
} from 'model/generics';
import { EFFECT_TEMPLATE_DEAD32 } from 'model/particle';
import { playerRemoveItem } from 'model/player';
import { roomAddParticle } from 'model/room';
import { playSoundName } from 'model/sound';
import { ModalSection } from 'model/store';
import { clearScreen } from 'view/draw';
import { renderUi } from 'view/ui';
import { ItemTemplate, ItemType, Item } from '.';

export const init = (exp: { [key: string]: ItemTemplate }) => {
  exp.FeeblePotion = {
    label: 'Feeble HP Potion',
    description:
      'This bottle contains a green liquid that, when imbibed, restores a rather uninspiring amount of HP.',
    effectDescription: 'Restore 5 hp.',
    type: ItemType.USABLE,
    onUse: async (item: Item) => {
      return new Promise(resolve => {
        showPartyMemberSelectModal({
          onCharacterSelected: (ch: Character) => {
            playSoundName('use_item');
            characterModifyHp(ch, 5);
            playerRemoveItem(getCurrentPlayer(), item.name as string);
            renderUi();

            setTimeout(() => {
              hideModal();
              resolve();
            }, 1000);
          },
          onClose: resolve,
          filter: ch => ch.hp > 0,
        });
      });
    },
  };

  exp.RezGem = {
    label: 'Respawn Gem',
    description:
      'According to the Official Regem Ludos Player Guide (ORLPG), this small gem is used to restore a character who has had their HP reduced to zero.',
    effectDescription: 'Revive character with 5 hp.',
    type: ItemType.USABLE,
    onUse: async (item: Item, isBattle?: boolean) => {
      return new Promise(resolve => {
        showPartyMemberSelectModal({
          onCharacterSelected: (ch: Character) => {
            playSoundName('rez');
            characterModifyHp(ch, 5);
            playerRemoveItem(getCurrentPlayer(), item.name as string);

            if (isBattle) {
              const battle = getCurrentBattle();
              const bCh = battleGetBattleCharacterFromCharacter(battle, ch);
              if (bCh) {
                hideModal();
                // this needs to be a loop anim because of how AnimDiv works (crappily)
                showBattleEffect([bCh], 'effect_heal_anim_loop');
                bCh.isDefeated = false;
                bCh.shouldRemove = false;
                if (!battle.allies.includes(bCh)) {
                  battle.allies.push(bCh);
                }
                enablePauseRendering();

                // have to use setTimeout here because timeoutPromise does not operate when paused,
                // and all items must be used while paused
                setTimeout(() => {
                  if (
                    characterHasAnimationState(
                      bCh.ch,
                      AnimationState.BATTLE_REVIVE
                    )
                  ) {
                    characterSetAnimationState(
                      bCh.ch,
                      AnimationState.BATTLE_REVIVE
                    );
                  } else {
                    battleCharacterSetAnimationIdle(bCh);
                    characterGetAnimation(bCh.ch).pause();
                  }
                }, 1000);
                setTimeout(() => {
                  battleCharacterSetAnimationIdle(bCh);
                  resetCooldownTimer(bCh);
                  battlePauseTimers(battle, [bCh]);
                  // hack I'm guessing it doesn't reset the timestamp if it's already paused but
                  // I don't really care to find out
                  bCh.actionTimer.timestampPause =
                    bCh.actionTimer.timestampStart;
                  characterGetAnimation(bCh.ch).pause();
                  disablePauseRendering();
                  hideBattleEffect();
                  resolve();
                }, 1500);
              }
            } else {
              renderUi();
              setTimeout(() => {
                hideModal();
                resolve();
              }, 1000);
            }
          },
          onClose: resolve,
          filter: ch => ch.hp <= 0,
        });
      });
    },
  };
};
