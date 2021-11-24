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
  getCurrentOverworld,
  getCurrentScene,
} from 'model/generics';
import { hideArcadeGame, hideSection } from 'controller/ui-actions';
import { AppSection } from 'model/store';
import { pause, unpause } from 'controller/loop';
import { questIsCompleted } from 'model/quest';
import { getIfExists as getQuest } from 'db/quests';

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
    const quest = getQuest('TicTacToe');
    if (!quest) {
      console.error('No TicTacToe quest exists.');
      return;
    }
    console.log('GAME HAS BEEN COMPLETED', result);
    if (score === -1 && !questIsCompleted(scene, quest)) {
      // player lost to AI 3 times
      const scene = getCurrentScene();
      hideArcadeGame();
      disableKeyUpdate();
      getCurrentOverworld().triggersEnabled = false;
      await callScript(scene, 'floor1-atrium-TicTacToeGirl-complete');
      getCurrentOverworld().triggersEnabled = true;
      enableKeyUpdate();
    } else if (score > -1) {
      // player won
      disableKeyUpdate();
      getCurrentOverworld().triggersEnabled = false;
      unpause();
      await createAndCallScript(
        scene,
        `
        +setConversation('Ada');
        +modifyTickets(${score});
        +endConversation();`
      );
      pause();
      getCurrentOverworld().triggersEnabled = true;
      enableKeyUpdate();
      hideSection(AppSection.Cutscene);
    }
  },
});
