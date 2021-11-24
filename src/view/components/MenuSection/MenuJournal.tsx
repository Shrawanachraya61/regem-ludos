/* @jsx h */
import { h, Fragment } from 'preact';
import { colors, keyframes, style } from 'view/style';
import VerticalMenu from 'view/elements/VerticalMenu';
import { useState } from 'preact/hooks';
import {
  getAllActiveQuests,
  getAllCompletedQuests,
  getCurrentQuestStep,
  getLastUpdatedQuests,
  questIsCompleted,
  resetLastUpdatedQuests,
} from 'model/quest';
import { Scene } from 'model/scene';
import { QuestTemplateWithName } from 'db/quests';
import { getIcon } from 'view/icons';
import { playSoundName } from 'model/sound';
import { getConfirmKey, getConfirmKeyLabel } from 'controller/events';

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
  zIndex: '1',
});

const RightDiv = style('div', {
  width: '50%',
});

const DescriptionWrapper = style('div', {
  width: '100%',
  height: '475px',
  zIndex: '1',
});

const DescriptionName = style('div', {
  border: '1px solid ' + colors.WHITE,
  background: colors.DARKGREY,
  // margin: '2px',
  // fontSize: '20px',
  textTransform: 'uppercase',
  padding: '16px',
  textAlign: 'center',
  marginBottom: '2px',
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
  height: 'calc(100% - 128px)',
});

const newIconBob = keyframes({
  '0%': {
    transform: 'translateY(-1px)',
  },
  '20%': {
    transform: 'translateY(-3px)',
  },
  '100%': {
    transform: 'translateY(-1px)',
  },
});
const NewIconWrapper = style('div', {
  animation: `${newIconBob} 850ms linear infinite`,
  width: '24px',
  height: '24px',
  position: 'absolute',
  right: '8px',
  top: '0px',
});

interface IMenuJournalProps {
  scene: Scene;
  isInactive: boolean;
  onClose: () => void;
}

const MenuJournal = (props: IMenuJournalProps) => {
  const scene = props.scene;
  const [updatedQuests, setUpdatedQuests] = useState(getLastUpdatedQuests());
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
  const startInd = quests.findIndex(q => q.name === updatedQuests[0]);
  const [selectedItemIndex, setSelectedItemIndex] = useState(
    startInd > -1 ? startInd : 0
  );

  const selectedQuest: QuestTemplateWithName | undefined =
    quests[selectedItemIndex];
  const selectedQuestStep = selectedQuest
    ? getCurrentQuestStep(scene, selectedQuest?.name)
    : undefined;
  const isCompleted = selectedQuest
    ? questIsCompleted(scene, selectedQuest)
    : false;

  return (
    <div style={{ width: '100%' }}>
      <p style={{ textAlign: 'center' }}>
        Press {getConfirmKeyLabel()} to mark read.
      </p>
      <InnerRoot>
        <LeftDiv>
          <DescriptionWrapper>
            <DescriptionName>
              {selectedQuest?.label ?? (
                <span style={{ color: colors.GREY }}>(No quest selected.)</span>
              )}
            </DescriptionName>
            <Description>{selectedQuest?.summary ?? ''}</Description>
            <DescriptionBody>
              {isCompleted ? (
                <p>You have completed this quest.</p>
              ) : (
                <>
                  <p
                    style={{
                      fontSize: '20px',
                      marginTop: '0px',
                    }}
                  >
                    {selectedQuestStep?.label ?? ''}
                  </p>
                  <p>{selectedQuestStep?.description ?? ''}</p>
                </>
              )}
              {selectedQuest?.steps?.map((questStep, i) => {
                if (!isCompleted && i >= (selectedQuestStep?.i ?? 0)) {
                  return <></>;
                }
                return (
                  <p
                    key={(questStep.completedScriptKey as string) + i}
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

              const NewIcon = getIcon('star');

              return {
                label: (
                  <div
                    style={{
                      color: isCompleted ? colors.LIGHTGREY : '',
                      position: 'relative',
                    }}
                  >
                    {quest.label}{' '}
                    {questIsCompleted(scene, quest) ? ' (completed)' : ''}
                    {updatedQuests.includes(quest.name) ? (
                      <NewIconWrapper>
                        <NewIcon color={colors.YELLOW} />
                      </NewIconWrapper>
                    ) : null}
                  </div>
                ),
                value: i,
              };
            })}
            onItemClickSound="menu_select"
            onItemClick={(val: number) => {
              setSelectedItemIndex(val);
              const quest = quests[val];
              const ind = updatedQuests.indexOf(quest.name);
              if (ind > -1) {
                playSoundName('terminal_beep');
                const newQuests = updatedQuests.slice();
                newQuests.splice(ind, 1);
                setUpdatedQuests(newQuests);
                resetLastUpdatedQuests(newQuests);
              }
            }}
            onItemHover={(val: number) => {
              setSelectedItemIndex(val);
            }}
          />
        </RightDiv>
      </InnerRoot>
    </div>
  );
};

export default MenuJournal;
