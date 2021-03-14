/* @jsx h */
import { h, Fragment } from 'preact';
import { colors } from 'view/style';
import {
  CabinetControlButton,
  ArcadeGamePath,
  registerArcadeGameMeta,
  IControlsProps,
  IHelpProps,
} from './ArcadeCabinetHelpers';
import HelpDialog from './ArcadeCabinetHelpDialog';
import Help from 'view/icons/Help';
import { createAndCallScript, callScript } from 'controller/scene-management';
import {
  disableKeyUpdate,
  enableKeyUpdate,
  getCurrentScene,
} from 'model/generics';
import { modifyTickets } from 'controller/scene-commands';
import { hideArcadeGame, hideSection } from 'controller/ui-actions';
import { AppSection } from 'model/store';

registerArcadeGameMeta(ArcadeGamePath.TIC_TAC_TOE, {
  title: 'Tic Tac Toe',
  tokensRequired: 1,
  controls: (props: IControlsProps) => {
    return (
      <>
        <CabinetControlButton
          width="48px"
          height="48px"
          type="text"
          onClick={() => {
            props.setHelpDialogOpen(true);
          }}
        >
          <Help color={colors.YELLOW} />
        </CabinetControlButton>
      </>
    );
  },
  help: (props: IHelpProps) => {
    return (
      <HelpDialog setOpen={props.setHelpDialogOpen} title="Tic Tac Toe Help">
        <p>On this machine you can play Tic Tac Toe.</p>
        <p>Insert a Token to start: 1 token = 3 games</p>
        <p>You are the 'X' player for each game.</p>
        <p>
          Place an 'X' by tapping/clicking the grid area where you wish to play.
        </p>
        <p>
          Place three 'X' in a row to win the game. You lose if there are three
          'O' in a row.
        </p>
        <p>
          Tickets are awarded based off of the number of times you beat the AI.
        </p>
      </HelpDialog>
    );
  },
  onGameCompleted: async (result: any) => {
    const score: number = result;
    const scene = getCurrentScene();
    if (
      score === -1 &&
      !scene.storage['quest_floor1-atrium_tic-tac-toe-complete']
    ) {
      // player lost to AI 3 times
      const scene = getCurrentScene();
      hideArcadeGame();
      disableKeyUpdate();
      await callScript(scene, 'floor1-atrium-TicTacToeGirl-complete');
      enableKeyUpdate();
    } else if (score > -1) {
      // player won
      disableKeyUpdate();
      await createAndCallScript(
        scene,
        `
        +setConversation('Ada');
        +modifyTickets(${score});
        +endConversation();`
      );
      enableKeyUpdate();
      hideSection(AppSection.Cutscene);
    }
  },
});
