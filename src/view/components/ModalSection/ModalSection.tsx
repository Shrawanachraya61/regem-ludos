/* @jsx h */
import { h, Fragment } from 'preact';
import { hideModal, hideSection } from 'controller/ui-actions';
import { AppSection, ModalSection } from 'model/store';
import DialogBox from 'view/elements/DialogBox';
import MenuBox from 'view/elements/MenuBox';
import { colors, style } from 'view/style';
import { getUiInterface, renderUi } from 'view/ui';
import { playSound } from 'controller/scene/scene-commands';
import { Point, timeoutPromise } from 'utils';
import {
  getBattleActionKey,
  getBattleActionLabel,
  getCancelKeyLabel,
  getConfirmKeyLabel,
  getPauseKeyLabel,
} from 'controller/events';
import { getCurrentBattle, getCurrentPlayer, getResPath } from 'model/generics';
import VerticalMenu from 'view/elements/VerticalMenu';
import StaticAnimDiv from 'view/elements/StaticAnimDiv';
import { Character, characterGetHpPct } from 'model/character';
import ProgressBar from 'view/elements/ProgressBar';
import CharacterNameLabel from 'view/elements/CharacterNameLabel';
import CharacterStatus from '../CharacterStatus';
import { useEffect, useState } from 'preact/hooks';
import UseItemDescription from '../UseItemDescription';
import CharacterFollowerMenu from 'view/elements/CharacterFollowerMenu';
import { SVGLine, useSVGLine } from 'view/hooks';
import { allyIndexToKey } from 'controller/battle-management';
import { battleSetEnemyRangeTargetIndex } from 'model/battle';
import MeleeTargetIcon from 'view/icons/TargetMelee';
import RangeTargetIcon from 'view/icons/Target';

export const MAX_WIDTH = '570px';
const TUTORIAL_MAX_WIDTH = '500px';
const INFO_MAX_WIDTH = '500px';

export interface ICustomModalProps {
  onClose: () => void;
  onConfirm?: (v?: any) => Promise<void> | void;
  active?: boolean;
  body?: any;
  danger?: boolean;
  filter?: (a: any) => boolean;
  meta?: any;
}

const CenterAligned = style('div', () => {
  return {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
  };
});

const TargetIconContainer = style('div', () => {
  return {
    width: '42px',
    height: '42px',
    display: 'inline-block',
    padding: '8px',
    border: '1px solid ' + colors.WHITE,
    marginBottom: '16px',
    background: colors.BLACK,
  };
});

const TutorialAttackModal = (props: ICustomModalProps) => {
  const svgId = 'line-dialog-box';
  const div1Id = 'line-dialog-box-div1';
  const div2Id = 'primary-Ada';

  useSVGLine({
    svgId,
    div1Id,
    div2Id,
    offset1: [0, 0],
    offset2: [0, -40],
  });

  const battle = getCurrentBattle();
  const key = allyIndexToKey(battle.alliesStorage.indexOf(battle.allies[0]));

  return (
    <>
      <DialogBox
        title="Tutorial"
        onClose={props.onClose}
        maxWidth={TUTORIAL_MAX_WIDTH}
        disableBackground={true}
        offset={[0, 100]}
      >
        <p>
          When this bar is full, continuously press {key} or tap Ada's portrait
          to <span style={{ color: colors.LIGHTBLUE }}>attack</span>. Ada can
          attack more than once.
        </p>
        <div id={div1Id}></div>
      </DialogBox>
      <SVGLine id={svgId} />
    </>
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
        pressing <b>{getPauseKeyLabel()}.</b>
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
          src={`${getResPath()}img/tutorial-training-swing.png`}
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
  const svgId = 'line-dialog-box';
  const div1Id = 'line-dialog-box-div1';
  const div2Id = 'name-label-Robot';

  useSVGLine({
    svgId,
    div1Id,
    div2Id,
    offset1: [0, 0],
    offset2: [0, 75],
  });

  return (
    <>
      <DialogBox
        title="Tutorial"
        onClose={props.onClose}
        maxWidth={TUTORIAL_MAX_WIDTH}
        disableBackground={true}
        offset={[200, -115]}
      >
        <div id={div1Id}></div>
        <p>
          Attacks fill this bar. When this bar is full, a character is{' '}
          <span style={{ color: colors.YELLOW }}>STAGGERED</span>.
        </p>
        <p>
          When <span style={{ color: colors.YELLOW }}>STAGGERED</span>, a
          character takes increased damage and cannot act until the bar
          depletes.
        </p>
      </DialogBox>
      <SVGLine id={svgId} />
    </>
  );
};

const TutorialBackRow = (props: ICustomModalProps) => {
  const battle = getCurrentBattle();
  const key = allyIndexToKey(battle.alliesStorage.indexOf(battle.allies[1]));

  useEffect(() => {
    if (diagIndex === 0) {
      // HACK Pointedly makes the range index in the back on render.  Maybe not the best
      // place for this...
      battleSetEnemyRangeTargetIndex(battle, 1);
      renderUi();
    }
  }, []);

  const [diagIndex, setDiagIndex] = useState(0);

  const svgId = 'line-dialog-box2';
  const div1Id = 'line-dialog-box-div1';
  let div2Id = 'primary-Conscience';

  let elem: any;
  let diagOffset: Point = [0, 0];
  let svgStartOffset: Point = [0, 0];
  let svgOffset: Point = [0, 0];
  if (diagIndex === 0) {
    elem = (
      <p>
        Conscience has joined! When this bar is full, press {key} or tap
        Conscience's portrait to{' '}
        <span style={{ color: colors.LIGHTBLUE }}>attack</span>. Both Conscience
        and Ada can attack simultaneously.
      </p>
    );
    diagOffset = [-128, 100];
    svgOffset = [0, -40];
    div2Id = 'primary-Conscience';
  } else if (diagIndex === 1) {
    elem = (
      <p>
        <CenterAligned>
          <TargetIconContainer>
            <RangeTargetIcon color={colors.RED} />
          </TargetIconContainer>
        </CenterAligned>
        Conscience has a{' '}
        <span style={{ color: colors.LIGHTRED }}>ranged weapon</span>. This icon
        indicates the target of all ranged attacks. It can be placed on any
        enemy on the battlefield by tapping the enemy.
      </p>
    );
    diagOffset = [-150, -20];
    svgStartOffset = [0, 85];
    div2Id = 'Robot M Fast_1';
  } else if (diagIndex === 2) {
    elem = (
      <p>
        <CenterAligned>
          <TargetIconContainer>
            <MeleeTargetIcon color={colors.YELLOW} />
          </TargetIconContainer>
        </CenterAligned>
        Ada has a <span style={{ color: colors.YELLOW }}>melee weapon</span>.
        This icon indicates the target of all melee attacks. It can ONLY be
        placed on any enemies in the{' '}
        <span style={{ color: colors.LIGHTGREEN }}>FRONT ROW</span> of the
        battlefield.
      </p>
    );
    diagOffset = [-205, 100];
    svgStartOffset = [0, 85];
    div2Id = 'Robot M_0';
  }

  useSVGLine({
    svgId,
    div1Id,
    div2Id,
    offset1: svgStartOffset,
    offset2: svgOffset,
  });

  return (
    <>
      <DialogBox
        title="Tutorial"
        onClose={() => {
          if (diagIndex < 2) {
            setDiagIndex(diagIndex + 1);
          } else {
            props.onClose();
          }
        }}
        maxWidth={TUTORIAL_MAX_WIDTH}
        disableBackground={true}
        offset={diagOffset}
        remainOpen={diagIndex < 2}
      >
        {diagIndex > 0 ? <div id={div1Id}></div> : null}
        {elem}
        {diagIndex === 0 ? <div id={div1Id}></div> : null}
      </DialogBox>
      <SVGLine id={svgId} />
    </>
  );
};

const TutorialMagic = (props: ICustomModalProps) => {
  const svgId = 'line-dialog-box';
  const div1Id = 'line-dialog-box-div1';
  const div2Id = 'Robot Mage_1';

  useSVGLine({
    svgId,
    div1Id,
    div2Id,
    offset1: [0, 0],
    offset2: [0, 0],
  });

  return (
    <>
      <DialogBox
        title="Tutorial"
        onClose={props.onClose}
        maxWidth={TUTORIAL_MAX_WIDTH}
        disableBackground={true}
        offset={[-75, -75]}
      >
        <p>
          A character casting a spell can be{' '}
          <span style={{ color: colors.LIGHTGREEN }}>INTERRUPTED</span> if
          enough damage is dealt.
        </p>
        <div id={div1Id}></div>
      </DialogBox>
      <SVGLine id={svgId} />
    </>
  );
};

const TutorialArmor = (props: ICustomModalProps) => {
  const [diagIndex, setDiagIndex] = useState(0);

  const svgId = 'line-dialog-box';
  const div1Id = 'line-dialog-box-div1';
  let div2Id = 'Robot Armored_0';

  let elem: any;
  let diagOffset: Point = [0, 0];
  let offset1: Point = [0, 0];
  let offset2: Point = [0, 0];

  if (diagIndex === 0) {
    elem = (
      <p>
        A character with armor is{' '}
        <span style={{ color: colors.YELLOW }}>IMMUNE</span> to physical damage.
        One point of armor can be removed by two characters landing attacks
        simultaneously.
      </p>
    );
    diagOffset = [-205, -5];
    offset2 = [40, 60];
    div2Id = 'Robot Armored_0';
  } else if (diagIndex === 1) {
    elem = (
      <p>
        Certain items are also able to remove armor. Items can be used in the
        pause menu{' '}
        <span style={{ color: colors.LIGHTRED }}>
          only when the enemy is not attacking
        </span>
        .
      </p>
    );

    diagOffset = [-275, -200];
    div2Id = 'top-bar-menu';
    offset1 = [-260, -150];
    offset2 = [0, 30];
  }

  useSVGLine({
    svgId,
    div1Id,
    div2Id,
    offset1,
    offset2,
  });

  return (
    <>
      <DialogBox
        title="Tutorial"
        onClose={() => {
          if (diagIndex < 1) {
            setDiagIndex(diagIndex + 1);
          } else {
            props.onClose();
          }
        }}
        maxWidth={TUTORIAL_MAX_WIDTH}
        remainOpen={diagIndex < 1}
        disableBackground={true}
        offset={diagOffset}
      >
        {elem}
        <div id={div1Id}></div>
      </DialogBox>
      <SVGLine id={svgId} />
    </>
  );
};

export const InfoModal = (props: ICustomModalProps) => {
  const body =
    typeof props.body === 'string' ? <p>{props.body}</p> : props.body;
  return (
    <DialogBox title="Info" onClose={props.onClose} maxWidth={INFO_MAX_WIDTH}>
      {body}
    </DialogBox>
  );
};

export const ConfirmModal = (props: ICustomModalProps) => {
  const body =
    typeof props.body === 'string' ? <p>{props.body}</p> : props.body;
  return (
    <DialogBox
      title="Confirm"
      onClose={props.onClose}
      onConfirm={props.onConfirm}
      maxWidth={INFO_MAX_WIDTH}
      danger={props.danger}
    >
      {body}
    </DialogBox>
  );
};

const PartyMember = style(
  'div',
  (props: { color?: string; padding?: string }) => {
    return {
      position: 'relative',
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

const SelectPartyMemberModal = (props: ICustomModalProps) => {
  const [selectedMember, setSelectedMember] = useState<Character | null>(null);

  const player = getCurrentPlayer();
  const party = player.party;

  return (
    <MenuBox
      title="Select Party Member"
      onClose={props.onClose}
      // maxWidth={INFO_MAX_WIDTH}
      closeButtonLabel={'Back ' + getCancelKeyLabel()}
      isModal={true}
      dark={true}
    >
      <div style={{ width: '600px' }}>
        {props.meta.itemNameForDescription ? (
          <UseItemDescription itemName={props.meta.itemNameForDescription} />
        ) : null}
        <VerticalMenu
          title="Party"
          open={true}
          isInactive={!props.active}
          width="600px"
          items={party.map(ch => {
            const isValid = party
              .filter(props.filter || (() => true))
              .includes(ch);
            return {
              label: (
                <PartyMember>
                  <CharacterStatus
                    ch={ch}
                    usePortrait={false}
                    style={{
                      filter: isValid
                        ? 'unset'
                        : 'blur(1px) brightness(0.25) sepia(75%) invert(25%)',
                    }}
                  />
                  {!isValid ? (
                    <div
                      style={{
                        position: 'absolute',
                        // filter: 'sepia(75%) invert(25%) brightness(0.5)',
                        // background:
                        //   'linear-gradient(90deg, rgba(169,59,59,1) 0%, rgba(169,59,59,0) 100%)',
                        width: '100%',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                        height: '106px',
                      }}
                    >
                      Select Another Character
                    </div>
                  ) : null}
                </PartyMember>
              ),
              value: ch,
            };
          })}
          onItemClickSound="menu_select"
          onItemClick={async val => {
            if (
              props.onConfirm &&
              party.filter(props.filter || (() => true)).includes(val)
            ) {
              if (props.meta?.showDelayInfo) {
                setSelectedMember(val);
              }
              await props.onConfirm(val);
              if (props.meta?.showDelayInfo) {
                setSelectedMember(null);
              }
            } else {
              playSound('terminal_cancel');
            }
          }}
        />
      </div>
    </MenuBox>
  );
};

const SelectCharacterFollowerModal = (props: ICustomModalProps) => {
  return (
    <CharacterFollowerMenu
      body={props.body}
      characters={props.meta.characters as Character[]}
      onCharacterClick={ch => {
        if (props.onConfirm) {
          props.onConfirm(ch);
        }
      }}
      onClose={props.onClose}
      isAll={props.meta.isAll}
    ></CharacterFollowerMenu>
  );
};

const Modal = () => {
  const [active, setActive] = useState(true);
  const modalState = getUiInterface()?.appState.modal;

  const section = modalState?.section;
  const onClose = modalState?.onClose;
  const onConfirm = modalState?.onConfirm;

  const handleClose = () => {
    hideSection(AppSection.Modal);
    setTimeout(() => {
      if (onClose) {
        onClose();
      }
    }, 1);
  };

  const handleConfirm = () => {
    if (active) {
      hideSection(AppSection.Modal);
      setTimeout(() => {
        if (onConfirm) {
          onConfirm();
        }
      }, 1);
    }
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
      elem = <InfoModal onClose={handleClose} body={modalState.body} />;
      break;
    }
    case ModalSection.CONFIRM: {
      elem = (
        <ConfirmModal
          onClose={handleClose}
          onConfirm={handleConfirm}
          body={modalState.body}
          danger={modalState.danger}
        />
      );
      break;
    }
    case ModalSection.SELECT_PARTY_MEMBER: {
      elem = (
        <SelectPartyMemberModal
          body={modalState.body}
          active={active}
          onClose={handleClose}
          onConfirm={async (ch: Character) => {
            if (active) {
              // setActive(false);
              if (onConfirm) {
                await onConfirm(ch);
              } else {
                hideSection(AppSection.Modal);
              }
            }
          }}
          filter={modalState.filter}
          meta={modalState.meta}
        />
      );
      break;
    }
    case ModalSection.SELECT_CHARACTER_FOLLOWER: {
      elem = (
        <SelectCharacterFollowerModal
          body={modalState.body}
          active={active}
          onClose={handleClose}
          onConfirm={async (ch: Character) => {
            if (active) {
              // setActive(false);
              if (onConfirm) {
                await onConfirm(ch);
              } else {
                hideSection(AppSection.Modal);
              }
            }
          }}
          filter={modalState.filter}
          meta={modalState.meta}
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
