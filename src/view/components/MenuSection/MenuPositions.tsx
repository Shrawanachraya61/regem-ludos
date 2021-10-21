/* @jsx h */
import { h } from 'preact';
import { colors, style } from 'view/style';
import VerticalMenu from 'view/elements/VerticalMenu';
import { Player, playerGetBattlePosition } from 'model/player';
import { useState } from 'preact/hooks';

import CharacterNameLabel from 'view/elements/CharacterNameLabel';
import {
  Character,
  characterGetAnimKey,
  characterSetFacing,
  Facing,
} from 'model/character';
import {
  BattleCharacter,
  battleCharacterCreateAlly,
  battleCharacterSetAnimationIdle,
} from 'model/battle-character';
import AnimDiv from 'view/elements/AnimDiv';
import { getBattleActionLabel } from 'controller/events';

const InnerRoot = style('div', {
  width: '800px',
});

const BattlePositionPreviewWrapper = style('div', () => {
  return {
    height: '225px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: colors.DARKGREEN,
    border: '1px solid ' + colors.WHITE,
    marginBottom: '8px',
  };
});

const PartyPreviewArea = style('div', () => {
  return {
    width: '400px',
    height: '200px',
    border: '1px solid ' + colors.GREEN,
  };
});

const PartyPreviewRow = style('div', () => {
  return {
    width: '100%',
    boxSizing: 'border-box',
    height: '100px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row-reverse',
  };
});

const PartyPreviewPosition = style('div', () => {
  return {
    position: 'relative',
    background: colors.DARKGREY,
    width: '100px',
    height: '100%',
    border: '1px solid ' + colors.GREEN,
    textAlign: 'center',
  };
});

const PartySelectWrapper = style('div', () => {
  return {
    display: 'flex',
    justifyContent: 'space-around',
  };
});

const CharacterListItem = style('div', (props: { selected?: boolean }) => {
  return {
    background: props.selected ? colors.DARKBLUE : colors.BLACK,
    borderRadius: '80px 0px 80px 0px',
    borderTopRightRadius: '0px',
    padding: props.selected ? '8px' : 'unset',
    marginBottom: props.selected ? '2px' : 'unset',
  };
});

interface IMenuPartyProps {
  player: Player;
  isInactive: boolean;
  onClose: () => void;
}

const renderBattlePosition = (
  bCh: BattleCharacter | undefined,
  i: number,
  row: 0 | 1
) => {
  const labels = ['Front', 'Middle', 'Back'];
  const keys0 = [
    getBattleActionLabel(0),
    getBattleActionLabel(2),
    getBattleActionLabel(4),
  ];
  const keys1 = [
    getBattleActionLabel(1),
    getBattleActionLabel(3),
    getBattleActionLabel(5),
  ];

  return (
    <PartyPreviewPosition key={bCh ? bCh.ch.name : i}>
      <div
        style={{
          color: colors.YELLOW,
          position: 'absolute',
          left: '2',
          top: '0',
        }}
      >
        {labels[i]}
      </div>

      <div
        style={{
          position: 'absolute',
          right: '2',
          bottom: '0',
        }}
      >
        {(row === 0 ? keys0 : keys1)[i]}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
        }}
      >
        {bCh ? (
          <AnimDiv
            animName={characterGetAnimKey(bCh.ch)}
            renderLoopId={bCh.ch.name + '-menu-party'}
            scale={2}
          ></AnimDiv>
        ) : null}
      </div>
    </PartyPreviewPosition>
  );
};

const createBattleCharactersFromParty = (
  party: Character[],
  player: Player
) => {
  return party
    .map(ch => {
      // HACK: don't want to modify the actual character, but this is only a shallow copy
      // and will break if the Character interface changes (unlikely, but possible)
      return {
        ...ch,
      };
    })
    .map(ch => {
      const ally = battleCharacterCreateAlly(ch, {
        position: playerGetBattlePosition(player, ch),
      });
      characterSetFacing(ally.ch, Facing.RIGHT);
      battleCharacterSetAnimationIdle(ally);
      return ally;
    });
};

const MenuParty = (props: IMenuPartyProps) => {
  const party = props.player.party;
  const [selectedChInd, setSelectedChInd] = useState<number>(-1);
  const [battleParty, setBattleParty] = useState(
    createBattleCharactersFromParty(party, props.player)
  );

  const row1 = [
    battleParty[0] ?? null,
    battleParty[2] ?? null,
    battleParty[4] ?? null,
  ];
  const row2 = [
    battleParty[1] ?? null,
    battleParty[3] ?? null,
    battleParty[5] ?? null,
  ];

  const swapCharacters = (ind1: number, ind2: number) => {
    if (ind1 !== ind2) {
      const ch1 = props.player.party[ind1];
      props.player.party[ind1] = props.player.party[ind2];
      props.player.party[ind2] = ch1;
      props.player.battlePositions = [...props.player.party];
    }
    setSelectedChInd(-1);
    setBattleParty(createBattleCharactersFromParty(party, props.player));
  };

  const isCharacterSelected = selectedChInd >= 0;

  return (
    <InnerRoot>
      <p>
        The order of your party members determines their formation in battle.
      </p>
      <p>
        Melee attacks can only target Characters in the front. All positions are
        targetable by ranged or wand attacks.
      </p>
      <BattlePositionPreviewWrapper>
        <PartyPreviewArea>
          <PartyPreviewRow>
            {row1.map((ch, i) => renderBattlePosition(ch, i, 0))}
          </PartyPreviewRow>
          <PartyPreviewRow>
            {row2.map((ch, i) => renderBattlePosition(ch, i, 1))}
          </PartyPreviewRow>
        </PartyPreviewArea>
      </BattlePositionPreviewWrapper>
      <p style={{ textAlign: 'center', color: colors.YELLOW }}>
        {isCharacterSelected
          ? 'Select party member with whom to swap positions.'
          : "Select a character who's position should be changed."}
      </p>
      <PartySelectWrapper>
        <VerticalMenu
          width="325px"
          maxHeight={'325px'}
          height="100%"
          open={true}
          isCursorSelectInactive={isCharacterSelected}
          title="Party Member"
          items={party.map((ch, i) => {
            return {
              label: (
                <CharacterListItem selected={i === selectedChInd}>
                  {i === selectedChInd ? (
                    ch.name.toUpperCase()
                  ) : (
                    <CharacterNameLabel>{ch.name}</CharacterNameLabel>
                  )}
                </CharacterListItem>
              ),
              value: i,
            };
          })}
          onItemClickSound="menu_select"
          onItemClick={(val: number) => {
            setSelectedChInd(val);
          }}
          hideCloseBox={true}
          onClose={() => {
            props.onClose();
          }}
        />
        <VerticalMenu
          width="325px"
          maxHeight={'325px'}
          height="100%"
          open={true}
          isInactive={!isCharacterSelected}
          style={{
            filter: !isCharacterSelected ? 'brightness(50%)' : 'unset',
          }}
          title="Swap"
          items={party.map((ch, i) => {
            return {
              label: (
                <CharacterListItem selected={false}>
                  <CharacterNameLabel>{ch.name}</CharacterNameLabel>
                </CharacterListItem>
              ),
              value: i,
            };
          })}
          onItemClickSound="menu_select2"
          onItemClick={(val: number) => {
            swapCharacters(selectedChInd, val);
          }}
          hideCloseBox={true}
          onCloseSound={'menu_select2'}
          onClose={() => {
            setSelectedChInd(-1);
          }}
        />
      </PartySelectWrapper>
    </InnerRoot>
  );
};

export default MenuParty;
