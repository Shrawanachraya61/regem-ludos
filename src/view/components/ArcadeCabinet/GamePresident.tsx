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

registerArcadeGameMeta(ArcadeGamePath.PRESIDENT, {
  title: 'President',
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
      <HelpDialog setOpen={props.setHelpDialogOpen} title="President Help">
        <p>This is the game President</p>
      </HelpDialog>
    );
  },
});
