import { h } from 'preact';
import { BattleTemplate } from 'model/battle';
import VerticalMenu from 'view/elements/VerticalMenu';
import { colors, style } from 'view/style';

import { setCurrentPlayer, setCurrentRoom } from 'model/generics';
import { playerCreate, playerSetBattlePosition } from 'model/player';
import { battleStatsCreate, BattlePosition } from 'model/battle';
import { AnimationState, Facing, characterCreateFromTemplate } from 'model/character';
import { initiateBattle } from 'controller/battle-management';
import { BattleActions } from 'controller/battle-actions';
import { renderUi } from 'view/ui';
import { showSection } from 'controller/ui-actions';
import { AppSection } from 'model/store';

interface IBattleSelectMenuProps {
  battles: { template: BattleTemplate; label: string }[];
}

const MenuWrapper = style('div', () => {
  return {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  };
});

const MenuLabel = style('div', () => {
  return {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  };
});

const beginBattle = (template: BattleTemplate) => {
  const player = playerCreate({
    name: 'Ada',
    spriteBase: 'ada',
    stats: battleStatsCreate(),
    facing: Facing.RIGHT,
    animationState: AnimationState.BATTLE_IDLE,
    skills: [BattleActions.Swing, BattleActions.Defend],
  });
  const conscience = characterCreateFromTemplate({
    name: 'Conscience',
    spriteBase: 'conscience',
    stats: battleStatsCreate(),
    facing: Facing.RIGHT,
    animationState: AnimationState.BATTLE_IDLE,
    skills: [BattleActions.Swing, BattleActions.Defend],   
  });
  player.party.push(conscience);
  playerSetBattlePosition(player, conscience, BattlePosition.BACK);
  initiateBattle(player, template);
  showSection(AppSection.BattleUI, true);
};

const BattleSelectMenu = (props: IBattleSelectMenuProps): h.JSX.Element => {
  return (
    <MenuWrapper>
      <VerticalMenu
        title="SELECT BATTLE"
        width="256px"
        open={true}
        items={props.battles.map(({ template, label }) => {
          return {
            label: (
              <MenuLabel>
                <span>{label}</span>
              </MenuLabel>
            ),
            value: template,
          };
        })}
        onItemClick={(template: BattleTemplate) => {
          console.log('clicked', template);
          beginBattle(template);
        }}
      />
    </MenuWrapper>
  );
};

export default BattleSelectMenu;
