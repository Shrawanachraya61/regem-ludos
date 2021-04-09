/* @jsx h */
import { h } from 'preact';
import { useState } from 'preact/hooks';
import { BattleCharacter } from 'model/battle-character';
import VerticalMenu from 'view/elements/VerticalMenu';
import { colors, style } from 'view/style';
import { BattleAction } from 'controller/battle-actions';
import { pause, unpause } from 'controller/loop';

interface IBattleActionMenuProps {
  bCh: BattleCharacter;
  open: boolean;
  onClose: () => void;
}
const MenuWrapper = style('div', () => {
  return {};
});

const MenuLabel = style('div', () => {
  return {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };
});

const MenuIcon = style('div', () => {
  return {
    width: '24px',
    height: '24px',
  };
});

const BattleActionMenu = (props: IBattleActionMenuProps): h.JSX.Element => {
  return (
    <MenuWrapper>
      <VerticalMenu
        title="ACTION"
        open={true}
        onClose={props.onClose}
        width="8rem"
        items={props.bCh.ch.skills.map((skill, i) => {
          return {
            label: (
              <MenuLabel>
                <span>{skill.name}</span>
                <MenuIcon>
                  {/* <skill.meta.icon color={colors.WHITE} /> */}
                </MenuIcon>
              </MenuLabel>
            ),
            value: i,
          };
        })}
        onItemClick={(value: number) => {
          props.bCh.ch.skillIndex = value;
          props.onClose();
        }}
      />
    </MenuWrapper>
  );
};

export default BattleActionMenu;
