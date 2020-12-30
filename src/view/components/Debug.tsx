import { h, Fragment } from 'preact';
import { style } from 'view/style';
import Button, { ButtonType } from 'view/elements/Button';

import BattleSelectMenu from 'view/components/BattleSelectMenu';
import encounters from 'db/encounters';

import ArcadeCabinet, { ArcadeGamePath } from 'view/components/ArcadeCabinet';

const ButtonContainer = style('div', () => {
  return {
    position: 'absolute',
    left: '0px',
    top: '0px',
  };
});

const Debug = () => {
  return (
    <div id="debug">
      <ArcadeCabinet game={ArcadeGamePath.INVADERZ} />
      {/* <ButtonContainer>
        <Button type={ButtonType.PRIMARY} onClick={() => {}}>
          <span>Click Me!</span>
        </Button>
      </ButtonContainer>
      <BattleSelectMenu
        battles={[
          {
            label: 'One vs One',
            template: encounters.ENCOUNTER_ONE_VS_ONE,
          },
          {
            label: 'One vs Two',
            template: encounters.ENCOUNTER_ONE_VS_TWO,
          },
          {
            label: 'One vs Three',
            template: encounters.ENCOUNTER_ONE_VS_THREE,
          },
        ]}
      /> */}
    </div>
  );
};

export default Debug;
