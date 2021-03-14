/* @jsx h */
import { h, Fragment } from 'preact';
import { useEffect } from 'preact/hooks';
import { style } from 'view/style';
import Button, { ButtonType } from 'view/elements/Button';

import BattleSelectMenu from 'view/components/BattleSelectMenu';
import encounters from 'db/encounters';

import ArcadeCabinet, { ArcadeGamePath } from 'view/components/ArcadeCabinet';
import OverworldSection from 'view/components/OverworldSection';

import { get as getOverworld } from 'db/overworlds';
import { initiateOverworld } from 'controller/overworld-management';
import { getCurrentPlayer, getCurrentScene } from 'model/generics';
import { playerCreate } from 'model/player';

import { callScript } from 'controller/scene-management';

import {
  AnimationState,
  Facing,
  characterCreateFromTemplate,
} from 'model/character';

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
      {/* <ArcadeCabinet game={ArcadeGamePath.INVADERZ} /> */}
      {/* <ButtonContainer>
        <Button type={ButtonType.PRIMARY} onClick={() => {}}>
          <span>Click Me!</span>
        </Button>
      </ButtonContainer>*/}
      {/* <BattleSelectMenu
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
      <OverworldSection />
    </div>
  );
};

export default Debug;
