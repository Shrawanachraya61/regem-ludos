/* @jsx h */
import { h } from 'preact';
import { colors, style } from 'view/style';
import StaticAnimDiv from 'view/elements/StaticAnimDiv';
import { ISave } from 'controller/save-management';
import Button, { ButtonType } from 'view/elements/Button';
import { getAuxKeyLabel } from 'controller/events';
import { msToTimeLabel } from 'utils';
import { get as getCharacter } from 'db/characters';

const SaveFile = style('div', (props: { color?: string; padding?: string }) => {
  return {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '64px',
    background: props.color ?? 'unset',
    padding: props.padding ?? 'unset',
    boxSizing: 'border-box',
    border: props.color ? `2px solid ${colors.DARKGREEN}` : 'unset',
  };
});

const SaveFileMain = style('div', () => {
  return {
    display: 'flex',
    justifyContent: 'flex-start',
    position: 'relative',
    alignItems: 'center',
    '& > div': {
      marginRight: '4px',
    },
  };
});

const PortraitContainer = style('div', () => {
  return {
    background: colors.DARKGREY,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderRight: '2px solid ' + colors.BLACK,
    width: '64',
    height: '64',
    cursor: 'pointer',
    overflow: 'hidden',
  };
});

interface ISaveGameListItemProps {
  save: ISave;
  i: number;
  handleDeleteClick?: (i: number) => void;
}

const SaveGameListItem = (props: ISaveGameListItemProps) => {
  const save = props.save;
  return (
    <SaveFile>
      <SaveFileMain>
        <div
          style={{
            display: 'flex',
            width: '200px',
            marginRight: '18px',
          }}
        >
          {save.player.partyStorage.map(chSave => {
            const chTemplate = getCharacter(chSave.name);
            return (
              <PortraitContainer>
                <StaticAnimDiv
                  style={{ width: '128' }}
                  animName={chTemplate?.spriteBase + '_portrait'}
                ></StaticAnimDiv>
              </PortraitContainer>
            );
          })}
        </div>
        Time: {msToTimeLabel(save.durationPlayed)}
      </SaveFileMain>
      {props.handleDeleteClick ? (
        <Button
          style={{
            minWidth: 'unset',
            fontSize: '12px',
          }}
          type={ButtonType.CANCEL}
          onClick={ev => {
            ev.stopPropagation();
            ev.preventDefault();
            if (props.handleDeleteClick) {
              props.handleDeleteClick(props.i);
            }
          }}
        >
          Delete {getAuxKeyLabel()}
        </Button>
      ) : null}
      {!props.handleDeleteClick ? (
        <div>Tokens: {save.player.tokens} </div>
      ) : null}
    </SaveFile>
  );
};

export default SaveGameListItem;
