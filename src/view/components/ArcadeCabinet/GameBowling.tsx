/* @jsx h */
import {
  registerArcadeGameMeta,
  ArcadeGamePath,
  callScriptSrcFromArcadeEvent,
} from './ArcadeCabinetHelpers';

registerArcadeGameMeta(ArcadeGamePath.BOWLING, {
  title: 'Regem Ludos Bowling',
  tokensRequired: 0,
  cabinet: {
    music: true,
    disabled: true,
    backgroundColor:
      'radial-gradient(circle, rgba(17,17,17,0) 81%, rgba(17,17,17,0.8239670868347339) 93%);',
  },
  onGameCompleted: async score => {
    let message = 'Good effort!';
    if (score >= 100) {
      message = 'Nice work!';
    } else if (score >= 150) {
      message = 'Great technique!';
    } else if (score >= 200) {
      message = 'Very impressive!';
    } else if (score >= 250) {
      message = "Wow, you're really good at this!";
    } else if (score === 300) {
      message = '<scale=1.5 color=ORANGE shake>A perfect game!!!!!!!</>';
    }

    await callScriptSrcFromArcadeEvent(
      `
      +fadeOut(1000);
      +setAtMarker(Ada, MarkerPreventBowling);
      +setAnimationState(Ada, idle);
      +lookAtEachOther(Ada, Floor1BowlingEmployee);
      +fadeIn(500);
      +setConversation(Ada);
      Floor1BowlingEmployee: "Looks like you bowled a ${score}.  ${message}"
      ${score > 200 ? '+:happy(Ada)' : ''}
      ${score > 250 ? '+:jump(Ada)' : ''}
      ${score >= 300 ? '+:jump(Ada)\n+:jump(Ada)' : ''}
      +resetAi(Floor1BowlingEmployee);
      +endConversation();
      `
    );
  },
  onGameCancelled: async () => {
    await callScriptSrcFromArcadeEvent(
      `
      +fadeOut(1000);
      +setAtMarker(Ada, MarkerPreventBowling);
      +setAnimationState(Ada, idle);
      +lookAtEachOther(Ada, Floor1BowlingEmployee);
      +fadeIn(500);
      +setConversation(Ada);
      Floor1BowlingEmployee: "Calling it quits early?"
      +resetAi(Floor1BowlingEmployee);
      +endConversation();
      `
    );
  },
});
