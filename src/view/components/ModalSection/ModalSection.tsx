/* @jsx h */
import { h } from 'preact';
import { hideSection } from 'controller/ui-actions';
import { AppSection, ModalSection } from 'model/store';
import DialogBox from 'view/elements/DialogBox';
import MenuBox from 'view/elements/MenuBox';
import { colors, style } from 'view/style';
import { getUiInterface } from 'view/ui';
import { playSound } from 'controller/scene-commands';
import { timeoutPromise } from 'utils';
import { getCancelKeyLabel } from 'controller/events';
import { getCurrentPlayer } from 'model/generics';
import VerticalMenu from 'view/elements/VerticalMenu';
import StaticAnimDiv from 'view/elements/StaticAnimDiv';
import { Character, characterGetHpPct } from 'model/character';
import ProgressBar from 'view/elements/ProgressBar';

const TUTORIAL_MAX_WIDTH = '500px';
const INFO_MAX_WIDTH = '256px';

interface ICustomModalProps {
  onClose: () => void;
  onConfirm?: (v?: any) => void;
  text?: string;
}

const CenterAligned = style('div', () => {
  return {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
  };
});

const TutorialAttackModal = (props: ICustomModalProps) => {
  return (
    <DialogBox
      title="Tutorial"
      onClose={props.onClose}
      maxWidth={TUTORIAL_MAX_WIDTH}
    >
      <p>Welcome to the Regem Ludos Battle System!</p>
      <p>
        To attack an enemy, wait for the action bar to fill up, then click the
        character portrait or press the action button corresponding to that
        character.
      </p>
      <CenterAligned>
        <img
          src="res/img/tutorial-ada-waiting-ready.png"
          alt="tutorial-image"
        ></img>
      </CenterAligned>
    </DialogBox>
  );
};

const TutorialPausing = (props: ICustomModalProps) => {
  return (
    <DialogBox
      title="Tutorial"
      onClose={props.onClose}
      maxWidth={TUTORIAL_MAX_WIDTH}
    >
      <p>
        At any time you can pause the game via the button in the top left or by
        pressing <b>Spacebar.</b>
      </p>
      <p>
        When the game is paused, you can see information about the currently
        selected actions for your party.
      </p>
    </DialogBox>
  );
};

const TutorialAttackAmounts = (props: ICustomModalProps) => {
  return (
    <DialogBox
      title="Tutorial"
      onClose={props.onClose}
      maxWidth={TUTORIAL_MAX_WIDTH}
    >
      <p>
        Ada currently has a <b>Swing</b> action equipped with two attacks.
      </p>
      <CenterAligned>
        <img
          src="res/img/tutorial-training-swing.png"
          alt="tutorial-image"
        ></img>
      </CenterAligned>
      <p>
        A <b>Swing</b> action will cause Ada to jump to the character targeted
        by the yellow sword symbol and initiate an attack. This consumes the
        first attack.
      </p>
      <p>
        For a short time afterwards, the action button can be pressed again to
        consume the next attack.
      </p>
      <p>
        This can be repeated until all the attacks specified on the action are
        consumed.
      </p>
    </DialogBox>
  );
};

const TutorialStagger = (props: ICustomModalProps) => {
  return (
    <DialogBox
      title="Tutorial"
      onClose={props.onClose}
      maxWidth={TUTORIAL_MAX_WIDTH}
    >
      <p>
        STAGGER is an important mechanic in the Regem Ludos Arcade Battle
        System!
      </p>
      <p>
        Below the HP bar of each character is a STAG gauge. This gage fills when
        the character is hit.
      </p>
      <p>If this gauge completely fills, then the character is STAGGERED</p>
      <p>
        While STAGGERED, a character takes double damage and their action bar is
        reset.
      </p>
    </DialogBox>
  );
};

const TutorialBackRow = (props: ICustomModalProps) => {
  return (
    <DialogBox
      title="Tutorial"
      onClose={props.onClose}
      maxWidth={TUTORIAL_MAX_WIDTH}
    >
      <p>
        Characters equipped with a <b>Swing</b> action can only target
        characters in the first row. Only when characters in the first row have
        been defeated can a character target the back rows with a <b>Swing</b>{' '}
        action.
      </p>
      <p>
        However, a character equipped with a <b>Shoot</b> action can target any
        character in the battle.
      </p>
      <p>
        Characters with a <b>Shoot</b> action will target the character
        indicated by the spinning, red circle. <b>Shoot</b> actions typically
        inflict less damage, but are especially useful at chipping down enemies
        on the back line.
      </p>
    </DialogBox>
  );
};

const TutorialMagic = (props: ICustomModalProps) => {
  return (
    <DialogBox
      title="Tutorial"
      onClose={props.onClose}
      maxWidth={TUTORIAL_MAX_WIDTH}
    >
      <p>
        Some enemies are able to use a <b>Magic</b> action. These abilities are
        usually very powerful and may also have a wide range of effects.
      </p>
      <p>
        To use a <b>Magic</b> action, however, a character must prepare the
        action first by entering into a CASTING state. During this state, a
        character cannot act until the CASTING is complete, or that character is
        interrupted. When a character is interrupted, the spell is stopped the
        character's action timer is reset.
      </p>
      <p>
        While a character is CASTING, they can be interrupted by taking damage
        from a character with a <b> Swing </b> action. A <b>Ranged</b> action
        does not interrupt a cast unless it otherwise states on the action
        description.
      </p>
    </DialogBox>
  );
};

const TutorialArmor = (props: ICustomModalProps) => {
  return (
    <DialogBox
      title="Tutorial"
      onClose={props.onClose}
      maxWidth={TUTORIAL_MAX_WIDTH}
    >
      <p>
        Some particularly difficult enemies have points of <b> Armor</b>. While
        an enemy has armor, any <b>Swing</b> action will do zero damage to that
        enemy.
      </p>
      <p>
        There are two primary ways to remove <b> Armor </b> from an enemy. The
        first is to hit two attacks simultaneously. This breaks one point of
        armor.
      </p>
      <p>
        The second is to use a <b>Swing</b> action with the PIERCE attribute. A
        PIERCE <b>Swing</b> action will immediately remove one point of armor
        when it hits.
      </p>
    </DialogBox>
  );
};

const InfoModal = (props: ICustomModalProps) => {
  return (
    <DialogBox title="Info" onClose={props.onClose} maxWidth={INFO_MAX_WIDTH}>
      <p>{props.text}</p>
    </DialogBox>
  );
};

const ConfirmModal = (props: ICustomModalProps) => {
  return (
    <DialogBox
      title="Confirm"
      onClose={props.onClose}
      onConfirm={props.onConfirm}
      maxWidth={INFO_MAX_WIDTH}
    >
      <p>{props.text}</p>
    </DialogBox>
  );
};

const PartyMember = style(
  'div',
  (props: { color?: string; padding?: string }) => {
    return {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      height: '93px',
      background: props.color ?? 'unset',
      padding: props.padding ?? 'unset',
      boxSizing: 'border-box',
      border: props.color ? `2px solid ${colors.DARKGREEN}` : 'unset',
    };
  }
);

const PartyMemberMain = style('div', () => {
  return {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    // width: '100%',
    // '& > div': {
    //   marginRight: '4px',
    // },
  };
});

const PortraitContainer = style('div', () => {
  return {
    background: colors.DARKGREY,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    // borderRight: '2px solid ' + colors.BLACK,
    border: `2px solid ${colors.WHITE}`,
    width: '93',
    height: '93',
    cursor: 'pointer',
    overflow: 'hidden',
  };
});

const CharacterNameLabel = style('div', () => {
  return {
    fontSize: '18px',
    color: colors.BLACK,
    background: colors.WHITE,
    // boxShadow: BOX_SHADOW,
    borderTopLeftRadius: '8px',
    borderTopRightRadius: '8px',
    textTransform: 'uppercase',
    // border: `2px solid ${colors.BLACK}`,
    padding: '8px',
    marginBottom: '2px',
  };
});

const ChInfoContainer = style('div', () => {
  return {
    width: '50%',
    display: 'flex',
    justifyContent: 'center',
    flexDirection: 'column',
    alignItems: 'flex-start',
  };
});

const PercentBarWrapper = style(
  'div',
  (props: { short: boolean; borderColor?: string }) => {
    return {
      // width: ,
      width: '100%',
      border: props.short
        ? 'unset'
        : `2px solid ${props.borderColor ?? colors.WHITE}`,
      borderBottom: props.short ? 'unset' : '0px',
    };
  }
);

const SelectPartyMemberModal = (props: ICustomModalProps) => {
  const player = getCurrentPlayer();
  const party = player.party;
  return (
    <MenuBox
      title="Select Party Member"
      onClose={props.onClose}
      maxWidth={INFO_MAX_WIDTH}
      closeButtonLabel={'Back ' + getCancelKeyLabel()}
    >
      <div style={{}}>
        <VerticalMenu
          title="Party"
          open={true}
          isInactive={false}
          items={party.map(ch => {
            return {
              label: (
                <PartyMember>
                  <ChInfoContainer>
                    <CharacterNameLabel id={'name-label-' + ch.name}>
                      {ch.name}
                    </CharacterNameLabel>
                    <PercentBarWrapper short={false}>
                      <ProgressBar
                        pct={characterGetHpPct(ch)}
                        backgroundColor={colors.BLACK}
                        color={colors.GREEN}
                        height={20}
                        label={`HP: ${ch.hp}`}
                      />
                    </PercentBarWrapper>
                  </ChInfoContainer>
                  <PartyMemberMain>
                    <PortraitContainer>
                      <StaticAnimDiv
                        style={{
                          width: '64',
                        }}
                        animName={`${ch.spriteBase.toLowerCase()}_idle_down`}
                      ></StaticAnimDiv>
                    </PortraitContainer>
                  </PartyMemberMain>
                </PartyMember>
              ),
              value: ch,
            };
          })}
          onItemClickSound="menu_select"
          onItemClick={props.onConfirm as any}
        />
      </div>
    </MenuBox>
  );
};

const Modal = () => {
  const modalState = getUiInterface()?.appState.modal;

  const section = modalState?.section;
  const onClose = modalState?.onClose;
  const onConfirm = modalState?.onConfirm;

  const handleClose = () => {
    console.log('HIDE MODAL');
    hideSection(AppSection.Modal);
    playSound('menu_close');
    timeoutPromise(1).then(() => {
      if (onClose) {
        onClose();
      }
    });
  };

  const handleConfirm = () => {
    console.log('HIDE MODAL CONFIRM');
    hideSection(AppSection.Modal);
    playSound('menu_close');
    timeoutPromise(1).then(() => {
      if (onConfirm) {
        onConfirm();
      }
    });
  };

  let elem: any = null;

  switch (section) {
    case ModalSection.TUTORIAL_ATTACK: {
      elem = <TutorialAttackModal onClose={handleClose} />;
      break;
    }
    case ModalSection.TUTORIAL_PAUSING: {
      elem = <TutorialPausing onClose={handleClose} />;
      break;
    }
    case ModalSection.TUTORIAL_ATTACK_AMOUNTS: {
      elem = <TutorialAttackAmounts onClose={handleClose} />;
      break;
    }
    case ModalSection.TUTORIAL_STAGGER: {
      elem = <TutorialStagger onClose={handleClose} />;
      break;
    }
    case ModalSection.TUTORIAL_BACK_ROW: {
      elem = <TutorialBackRow onClose={handleClose} />;
      break;
    }
    case ModalSection.TUTORIAL_MAGIC: {
      elem = <TutorialMagic onClose={handleClose} />;
      break;
    }
    case ModalSection.TUTORIAL_ARMOR: {
      elem = <TutorialArmor onClose={handleClose} />;
      break;
    }
    case ModalSection.INFO: {
      elem = <InfoModal onClose={handleClose} text={modalState.text} />;
      break;
    }
    case ModalSection.CONFIRM: {
      elem = (
        <ConfirmModal
          onClose={handleClose}
          onConfirm={handleConfirm}
          text={modalState.text}
        />
      );
      break;
    }
    case ModalSection.SELECT_PARTY_MEMBER: {
      elem = (
        <SelectPartyMemberModal
          onClose={handleClose}
          onConfirm={(ch: Character) => {
            hideSection(AppSection.Modal);
            playSound('menu_select');
            timeoutPromise(1).then(() => {
              if (onConfirm) {
                onConfirm(ch);
              }
            });
          }}
        />
      );
      break;
    }
    default: {
      elem = <div>No Modal Specified.</div>;
    }
  }
  return elem;
};

export default Modal;
