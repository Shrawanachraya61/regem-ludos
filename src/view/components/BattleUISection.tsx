import { h, Fragment } from 'preact';
import { useState } from 'preact/hooks';
import { style } from 'view/style';
import BattleCharacterButton from 'view/components/BattleCharacterStatus';
import { getCurrentBattle, BattleCharacter } from 'model/battle';
import BattleActionMenu from 'view/components/BattleActionMenu';
import Button, { ButtonType } from 'view/elements/Button';
import { battleSetChButtonsStatus } from 'controller/ui-actions';
import { BattleAction } from 'controller/battle-actions';
import { pause, unpause } from 'controller/loop';

const BottomBarWrapper = style('div', {
  position: 'absolute',
  bottom: '0px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  flexDirection: 'column',
  width: '100%',
});

const CharacterButtonsWrapper = style('div', {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  width: '100%',
});

const PauseButtonWrapper = style('div', {
  position: 'absolute',
  bottom: '150px',
  width: '100%',
  display: 'flex',
  justifyContent: 'center',
});

const CharacterButtonDivider = style('div', {
  margin: '16px',
});

const BattleUISection = () => {
  const [menuVisible, setMenuVisible] = useState(false);
  const battle = getCurrentBattle();

  const closeMenu = () => {
    unpause();
    battleSetChButtonsStatus(true);
    setMenuVisible(false);
  };
  return (
    <>
      {menuVisible ? null : (
        <PauseButtonWrapper>
          <Button
            type={ButtonType.PRIMARY}
            onClick={() => {
              setMenuVisible(!menuVisible);
              pause();
            }}
          >
            Don't Click Me
          </Button>
        </PauseButtonWrapper>
      )}
      <BottomBarWrapper>
        <CharacterButtonsWrapper>
          {battle.allies.map((ch: BattleCharacter) => {
            return (
              <CharacterButtonDivider>
                <BattleCharacterButton battle={battle} bCh={ch} />
              </CharacterButtonDivider>
            );
          })}
        </CharacterButtonsWrapper>
        {menuVisible ? (
          <BattleActionMenu
            onClose={() => {
              closeMenu();
            }}
            open={menuVisible}
            bCh={battle.allies[0]}
          />
        ) : null}
      </BottomBarWrapper>
    </>
  );
};

export default BattleUISection;
