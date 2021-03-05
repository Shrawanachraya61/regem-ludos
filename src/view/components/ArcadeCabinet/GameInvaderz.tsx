import { h, Fragment } from 'preact';
import { colors } from 'view/style';
import { SDLKeyID, buttonHandlers } from './ArcadeCabinet';
import {
  registerArcadeGameMeta,
  CabinetControlButton,
  ArcadeGamePath,
  IControlsProps,
  IHelpProps,
} from './ArcadeCabinetHelpers';
import HelpDialog from './ArcadeCabinetHelpDialog';
import Help from 'view/icons/Help';
import Arrow from 'view/icons/Arrow';

registerArcadeGameMeta(ArcadeGamePath.INVADERZ, {
  title: 'INVADERZ',
  tokensRequired: 1,
  controls: () => (
    <>
      <CabinetControlButton
        width="48px"
        height="48px"
        {...buttonHandlers(SDLKeyID.Left)}
      >
        <Arrow color={colors.GREEN} direction="left"></Arrow>
      </CabinetControlButton>
      <CabinetControlButton
        width="48px"
        height="48px"
        {...buttonHandlers(SDLKeyID.Right)}
      >
        <Arrow color={colors.GREEN} direction="right"></Arrow>
      </CabinetControlButton>
      <CabinetControlButton
        width="48px"
        height="48px"
        type="text"
        {...buttonHandlers(SDLKeyID.Space)}
      >
        FIRE
      </CabinetControlButton>
      <CabinetControlButton
        width="48px"
        height="48px"
        type="text"
        {...buttonHandlers(SDLKeyID.Enter)}
      >
        START
      </CabinetControlButton>
    </>
  ),
});
