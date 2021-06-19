/* @jsx h */
import { h } from 'preact';
import { colors, style } from 'view/style';
import VerticalMenu from 'view/elements/VerticalMenu';
import { useState } from 'preact/hooks';
import {
  getAllActiveQuests,
  getAllCompletedQuests,
  getCurrentQuestStep,
} from 'controller/quest';
import { Scene } from 'model/scene';
import { QuestTemplateWithName } from 'db/quests';

const MAX_HEIGHT = '628px';

const InnerRoot = style('div', {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  width: '100%',
  // height: '100%',
});

const LeftDiv = style('div', {
  width: '50%',
  maxHeight: MAX_HEIGHT,
});

const RightDiv = style('div', {
  width: '50%',
});

const DescriptionWrapper = style('div', {
  width: '100%',
  height: '475px',
});

const DescriptionName = style('div', {
  border: '1px solid ' + colors.WHITE,
  background: colors.DARKBLUE,
  // margin: '2px',
  padding: '16px',
});

const Description = style('div', {
  border: '1px solid ' + colors.WHITE,
  background: colors.DARKBLUE,
  // margin: '2px',
  padding: '16px',
  height: '72px',
  boxSizing: 'border-box',
});

const DescriptionBody = style('div', {
  border: '1px solid ' + colors.WHITE,
  background: colors.DARKGREY_ALT,
  margin: '2px 0px',
  padding: '16px',
  height: 'calc(100% - 126px)',
});

interface IMenuJournalProps {
  scene: Scene;
  isInactive: boolean;
  onClose: () => void;
}

const MenuJournal = (props: IMenuJournalProps) => {
  const scene = props.scene;
  const quests = getAllActiveQuests(scene).concat(getAllCompletedQuests(scene));
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);

  const selectedQuest: QuestTemplateWithName | undefined =
    quests[selectedItemIndex];
  const selectedQuestStep = getCurrentQuestStep(scene, selectedQuest?.name);

  return (
    <InnerRoot>
      <LeftDiv>
        <DescriptionWrapper>
          <DescriptionName>{selectedQuest?.label ?? ''}</DescriptionName>
          <Description>{selectedQuest?.description ?? ''}</Description>
          <DescriptionBody>
            <p>{selectedQuestStep?.label ?? ''}</p>
            <p>{selectedQuestStep?.description ?? ''}</p>
          </DescriptionBody>
        </DescriptionWrapper>
      </LeftDiv>
      <RightDiv>
        <VerticalMenu
          width="100%"
          maxHeight={parseInt(MAX_HEIGHT) - 128 + 'px'}
          open={true}
          isInactive={props.isInactive}
          hideTitle={true}
          items={quests.map((quest, i) => {
            return {
              label: (
                <div
                  style={{
                    background:
                      i === selectedItemIndex ? colors.DARKRED : colors.BLACK,
                  }}
                >
                  {quest.label}
                </div>
              ),
              value: i,
            };
          })}
          onItemClickSound="menu_select"
          onItemClick={(val: number) => {
            setSelectedItemIndex(val);
          }}
        />
      </RightDiv>
    </InnerRoot>
  );
};

export default MenuJournal;
