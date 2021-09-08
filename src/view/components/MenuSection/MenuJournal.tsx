/* @jsx h */
import { h, Fragment } from 'preact';
import { colors, style } from 'view/style';
import VerticalMenu from 'view/elements/VerticalMenu';
import { useState } from 'preact/hooks';
import {
  getAllActiveQuests,
  getAllCompletedQuests,
  getCurrentQuestStep,
  questIsCompleted,
} from 'controller/quest';
import { Scene } from 'model/scene';
import { QuestTemplateWithName } from 'db/quests';

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
  background: colors.DARKRED,
  // margin: '2px',
  padding: '16px',
  textAlign: 'center',
});

const Description = style('div', {
  border: '1px solid ' + colors.WHITE,
  background: colors.DARKRED,
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
  const quests = getAllActiveQuests(scene)
    .concat(getAllCompletedQuests(scene))
    .sort((a, b) => {
      const completedA = questIsCompleted(scene, a);
      const completedB = questIsCompleted(scene, b);
      if (a.name === 'Main') {
        return -1;
      } else if (b.name === 'Main') {
        return 1;
      } else if (completedA && completedB) {
        return a.name < b.name ? -1 : 1;
      } else if (completedA) {
        return 1;
      } else if (completedB) {
        return -1;
      } else {
        return a.name < b.name ? -1 : 1;
      }
    });
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);

  const selectedQuest: QuestTemplateWithName | undefined =
    quests[selectedItemIndex];
  const selectedQuestStep = getCurrentQuestStep(scene, selectedQuest?.name);
  const isCompleted = questIsCompleted(scene, selectedQuest);

  return (
    <InnerRoot>
      <LeftDiv>
        <DescriptionWrapper>
          <DescriptionName>{selectedQuest?.label ?? ''}</DescriptionName>
          <Description>{selectedQuest?.summary ?? ''}</Description>
          <DescriptionBody>
            {isCompleted ? (
              <p>You have completed this quest.</p>
            ) : (
              <>
                <p>{selectedQuestStep?.label ?? ''}</p>
                <p>{selectedQuestStep?.description ?? ''}</p>
              </>
            )}
            {selectedQuest.steps.map((questStep, i) => {
              if (!isCompleted && i >= (selectedQuestStep?.i ?? 0)) {
                return <></>;
              }
              return (
                <p
                  key={questStep.completedScriptKey + i}
                  style={{
                    textDecoration: 'line-through',
                    color: colors.LIGHTGREY,
                  }}
                >
                  {questStep.label}
                </p>
              );
            })}
          </DescriptionBody>
        </DescriptionWrapper>
      </LeftDiv>
      <RightDiv>
        <VerticalMenu
          width="100%"
          maxHeight={parseInt(MAX_HEIGHT) - 163 + 'px'}
          open={true}
          isInactive={props.isInactive}
          // hideTitle={true}
          title="Quest Name"
          items={quests.map((quest, i) => {
            const isCompleted = questIsCompleted(scene, quest);

            return {
              label: (
                <div
                  style={{
                    color: isCompleted ? colors.LIGHTGREY : '',
                  }}
                >
                  {quest.label}{' '}
                  {questIsCompleted(scene, quest) ? ' (completed)' : ''}
                </div>
              ),
              value: i,
            };
          })}
          onItemClickSound="menu_select"
          onItemClick={(val: number) => {
            setSelectedItemIndex(val);
          }}
          onItemHover={(val: number) => {
            setSelectedItemIndex(val);
          }}
        />
      </RightDiv>
    </InnerRoot>
  );
};

export default MenuJournal;
