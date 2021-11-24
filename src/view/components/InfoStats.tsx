/* @jsx h */
import { h, Fragment } from 'preact';
import { getCancelKeyLabel } from 'controller/events';
import { getUiInterface } from 'view/ui';
import { playSoundName } from 'model/sound';
import MenuBox from 'view/elements/MenuBox';
import { colors, keyframes, style } from 'view/style';
import VerticalMenu from 'view/elements/VerticalMenu';
import { get as getStore } from 'db/stores';
import { get as getItem } from 'db/items';
import { getCurrentPlayer, getItemStores, setItemStores } from 'model/generics';
import { IItemStoreSave } from 'controller/save-management';
import { getIcon } from 'view/icons';
import { useEffect, useState } from 'preact/hooks';
import ItemDescription from './ItemDescription';
import { CardSize, sizes as cardSizes } from 'view/elements/Card';
import {
  playerAddItem,
  playerGetItemCount,
  playerModifyTickets,
} from 'model/player';
import { useReRender } from 'view/hooks';
import { getScores, IHighScore } from 'model/scores';

const MAX_HEIGHT = '628px';

const InnerRoot = style('div', {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  width: '100%',
  zIndex: '1',
  // height: '100%',
});

const LeftDiv = style('div', {
  width: '40%',
  maxHeight: MAX_HEIGHT,
});

const RightDiv = style('div', {
  width: '60%',
});

const DescriptionWrapper = style('div', {
  width: '100%',
  height: '400px',
  border: '1px solid ' + colors.WHITE,
  background: colors.DARKGREY_ALT,
});

const GameTitle = style('div', {
  margin: '1px',
  border: '1px solid white',
  background: colors.DARKPURPLE,
  fontSize: '32px',
  textAlign: 'center',
});

const ScoreEntry = style('div', {
  margin: '4px 8px',
  fontSize: '24px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
});

const InfoStatsSection = (props: { onClose?: () => void }) => {
  const handleCloseClick = () => {
    const onClose =
      props.onClose ?? getUiInterface().appState.infoStats.onClose;

    // sound handle in ui-actions
    // if (!props.onClose) {
    //   playSoundName('menu_choice_close');
    // }
    onClose();
  };

  const scores = getScores();
  const scoresList: IHighScore[] = [];
  for (const i in scores) {
    scoresList.push(scores[i]);
  }
  scoresList.sort((a, b) => {
    return a.gameLabel < b.gameLabel ? -1 : 1;
  });
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);
  const selectedLeaderboard = scoresList[selectedItemIndex];
  const player = getCurrentPlayer();

  return (
    <MenuBox
      title="High Scores"
      onClose={() => {
        handleCloseClick();
      }}
      disableCloseSound={true}
      dark={true}
      maxWidth={cardSizes[CardSize.XLARGE].width}
      closeButtonLabel={'Back ' + getCancelKeyLabel()}
    >
      <div
        style={{
          width: '100%',
        }}
      >
        <p>Hover over a game to see the current high scores.</p>
        <InnerRoot>
          <LeftDiv>
            <VerticalMenu
              width="100%"
              maxHeight={'357px'}
              open={true}
              isInactive={false}
              hideTitle={false}
              startingIndex={0}
              itemHeight={48}
              title={'Games'}
              items={scoresList.map((gameEntry, i) => {
                return {
                  label: <div>{gameEntry.gameLabel}</div>,
                  value: i,
                };
              })}
              onItemClickSound="menu_select"
              onItemClick={val => {
                // handleItemClick(val);
              }}
              onItemHover={(val: number) => {
                setSelectedItemIndex(val);
              }}
            />
          </LeftDiv>
          <RightDiv>
            <DescriptionWrapper>
              <GameTitle>{selectedLeaderboard.gameLabel}</GameTitle>
              {selectedLeaderboard.leaderboard.slice(0, 10).map((entry, i) => {
                return (
                  <ScoreEntry key={entry.playerLabel + entry.score + i}>
                    <span>
                      {i + 1}.) {entry.playerLabel}
                    </span>
                    <span>{entry.score}</span>
                  </ScoreEntry>
                );
              })}
            </DescriptionWrapper>
          </RightDiv>
        </InnerRoot>
      </div>
    </MenuBox>
  );
};

export default InfoStatsSection;
