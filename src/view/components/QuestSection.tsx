/* @jsx h */
import { h, Fragment } from 'preact';
import { colors, style } from 'view/style';
import { showModal, showNotification } from 'controller/ui-actions';
import { ModalSection } from 'model/store';
import Card, { CardSize, sizes as cardSizes } from 'view/elements/Card';
import { pause, unpause } from 'controller/loop';
import {
  isCancelKey,
  getCancelKeyLabel,
  isConfirmKey,
  getConfirmKey,
  getConfirmKeyLabel,
} from 'controller/events';
import { useState } from 'lib/preact-hooks';
import { playSoundName } from 'model/sound';
import {
  saveGame,
  loadSaveListFromLS,
  ISave,
  loadGame,
} from 'controller/save-management';
import VerticalMenu from 'view/elements/VerticalMenu';
import { useKeyboardEventListener } from 'view/hooks';
import MenuBox from 'view/elements/MenuBox';
import { QuestTemplate } from 'db/quests';
import { playerAddExperience } from 'model/player';
import { getCurrentPlayer } from 'model/generics';
import FlowerIcon from 'view/icons/Flower';
import CharacterNameLabel from 'view/elements/CharacterNameLabel';

const RewardsList = style('div', () => {
  return {
    fontSize: '16px',
    width: '50%',
    boxSizing: 'border-box',
    padding: '16px',
    margin: '8px',
    border: `2px solid ${colors.WHITE}`,
    background: 'rgba(0, 0, 0, 0.5)',
  };
});

const QuestContent = style('div', () => {
  return {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '75%',
    left: '12.5%',
    position: 'relative',
  };
});

const QuestDescription = style('div', () => {
  return {
    padding: '16px',
    background: colors.DARKGREY_ALT,
    border: '2px solid ' + colors.WHITE,
    margin: '64px 0px',
    marginTop: '42px',
  };
});

const IconsWrapper = style('div', () => {
  return {
    width: '100%',
    height: '36px',
    display: 'flex',
    justifyContent: 'space-between',
  };
});

const IconContainer = style('div', () => {
  return {
    width: '96px',
    height: '96px',
    border: '2px solid ' + colors.BLUE,
    borderTopColor: colors.WHITE,
  };
});

interface IQuestSectionProps {
  onClose: () => void;
  status: 'started' | 'completed';
  quest: QuestTemplate;
}

const QuestSection = (props: IQuestSectionProps) => {
  const handleCloseClick = () => {
    if (props.status === 'completed') {
      setTimeout(() => {
        let leveledUp = false;
        let leveledUpText = 'The following party members have leveled up:';
        playerAddExperience(
          getCurrentPlayer(),
          props.quest.experienceReward ?? 0
        ).forEach((ch, i) => {
          leveledUp = true;
          leveledUpText += (i === 0 ? ' ' : ', ') + ch.name;
        });
        if (leveledUp) {
          playSoundName('level_up');
          showNotification({ text: leveledUpText, type: 'info' });
        }

        const player = getCurrentPlayer();
        if (quest.tokensReward) {
          player.tokens += quest.tokensReward;
        }
        if (quest.ticketsReward) {
          player.tickets += quest.ticketsReward;
        }
      }, 250);
    }
    props.onClose();
  };

  const quest = props.quest;

  return (
    <MenuBox
      title="Quest"
      onClose={() => {
        handleCloseClick();
      }}
      maxWidth={cardSizes[CardSize.XLARGE].width}
      closeButtonLabel={'Continue ' + getConfirmKeyLabel()}
      disableKeyboardShortcut={true}
      hideClose={true}
    >
      <div style={{ width: '100%' }}>
        {props.status === 'completed' ? (
          <QuestContent>
            <div style={{ fontSize: '24px' }}> Quest Completed! </div>
            <p style={{ width: '100%', textAlign: 'center' }}>
              You have completed:{' '}
              <span style={{ color: colors.YELLOW }}>{quest.label}</span>
            </p>
            <CharacterNameLabel>Rewards</CharacterNameLabel>
            <RewardsList>
              {quest.experienceReward ? (
                <div>{quest.experienceReward} EXP</div>
              ) : null}
              {quest.tokensReward ? (
                <div>{quest.tokensReward} Tokens</div>
              ) : null}
              {quest.ticketsReward ? (
                <div>{quest.ticketsReward} Tickets</div>
              ) : null}
              {quest.itemsReward
                ? quest.itemsReward().map((item, i) => {
                    return <div key={i}>{item.label}</div>;
                  })
                : null}
            </RewardsList>
            <IconsWrapper>
              <IconContainer
                style={{
                  backgroundColor: colors.BLACK,
                  borderTopRightRadius: '16px',
                }}
              >
                {quest.icon ? (
                  <quest.icon color={quest.iconColor || colors.WHITE} />
                ) : (
                  <FlowerIcon color={quest.iconColor || colors.WHITE} />
                )}
              </IconContainer>
              <IconContainer
                style={{
                  borderTopLeftRadius: '16px',
                  backgroundColor: colors.BLACK,
                }}
              >
                <FlowerIcon color={colors.YELLOW} />
              </IconContainer>
            </IconsWrapper>
          </QuestContent>
        ) : (
          <QuestContent>
            <div style={{ fontSize: '24px', marginTop: '16px' }}>
              Quest Started!
            </div>
            <QuestDescription>
              <p
                style={{
                  marginTop: '10px',
                  fontSize: '24px',
                }}
              >
                You have started:{' '}
                <span style={{ color: colors.YELLOW }}>{quest.label}</span>
              </p>
              <p style={{ width: '100%' }}> {quest.description}</p>
            </QuestDescription>
            <IconsWrapper>
              <IconContainer
                style={{
                  backgroundColor: colors.BLACK,
                  borderTopRightRadius: '16px',
                }}
              >
                {quest.icon ? (
                  <quest.icon color={quest.iconColor || colors.WHITE} />
                ) : (
                  <FlowerIcon color={quest.iconColor || colors.WHITE} />
                )}
              </IconContainer>
              <IconContainer
                style={{
                  borderTopLeftRadius: '16px',
                  backgroundColor: colors.BLACK,
                }}
              >
                <FlowerIcon color={colors.YELLOW} />
              </IconContainer>
            </IconsWrapper>
          </QuestContent>
        )}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            margin: '16px',
          }}
        >
          <VerticalMenu
            title=""
            // width="50%"
            open={true}
            hideTitle
            style={{
              transition: 'transform 0.15s',
              transform: 'scaleX(1)',
              width: '128px',
            }}
            items={[
              {
                label: (
                  <div>
                    <span>Continue</span>
                  </div>
                ),
                value: 0,
              },
            ]}
            onItemClickSound="menu_select"
            onItemClick={() => {
              handleCloseClick();
            }}
          />
        </div>
      </div>
    </MenuBox>
  );
};

export default QuestSection;
