/* @jsx h */
import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { sceneStopWaitingUntil } from 'model/scene';
import { style } from 'view/style';
import { getCurrentScene } from 'model/generics';
import { getUiInterface } from 'view/ui';
import VerticalMenu from 'view/elements/VerticalMenu';
import { hideChoices } from 'controller/ui-actions';
import { playSoundName } from 'model/sound';

const Root = style('div', {
  position: 'absolute',
  top: '0px',
  overflow: 'hidden',
  width: '100%',
  height: '100%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  background: 'rgba(0, 0, 0, 0.5)',
});

const CutsceneChoicesSection = () => {
  const choicesState = getUiInterface().appState.choices;
  const [rendered, setRendered] = useState(false);
  useEffect(() => {
    if (!rendered) {
      setRendered(true);
    }
  }, [rendered]);

  return (
    <Root>
      <VerticalMenu
        title="Choose"
        width="50%"
        open={true}
        style={{
          transition: 'transform 0.15s',
          transform: rendered ? 'scaleX(1)' : 'scaleX(0)',
        }}
        items={choicesState.choiceTexts.map((choiceText: string, i: number) => {
          return {
            label: (
              <div>
                <span>{choiceText}</span>
              </div>
            ),
            value: i,
          };
        })}
        onItemClickSound="menu_select"
        onItemClick={(i: number) => {
          const scene = getCurrentScene();
          scene.storage.lastChoiceIndex = i;
          sceneStopWaitingUntil(scene);
          hideChoices();
        }}
      />
    </Root>
  );
};

export default CutsceneChoicesSection;
