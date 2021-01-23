import { getUiInterface } from 'view/ui';
import {
  setCutsceneText,
  showSection,
  startConversation2,
  startConversation,
  hideConversation,
  showConversation,
} from 'controller/ui-actions';
import { AppSection, CutsceneSpeaker } from 'model/store';
import { popKeyHandler, pushKeyHandler } from 'controller/events';
import {
  characterGetPosCenterPx,
  characterSetFacing,
  characterSetFacingFromAngle,
  characterSetPos,
  characterSetWalkTarget,
  Facing,
} from 'model/character';
import { roomGetCharacterByName } from 'model/room';
import { getCurrentScene, getCurrentRoom } from 'model/generics';
import { callScript as sceneCallScript } from 'controller/scene-management';
import { getAngleTowards, Point } from 'utils';

/**
 * Displays dialog in a text box with the given actorName as the one speaking.
 * 
 * An optional soundName may be given to play a sound when the text is shown.  This command
 * only works when a `conversation` is active, created by a command like `setConversation`
 * or `setConversation2`.  The text is shown to the user and the program waits for input
 * from the user before proceeding to the next command.
 *
 * This is the command generated in rpgscript when a line is specified with an actor
 * name followed by a colon, then quoted text.
 *
 * ```
 * Conscience: "Whoah. You got a high score!"
 * ```
 *
 * Converts to the command:
 *
 * ```
 * playDialog('Conscience', 'Whoah. You got a high score!');
 * ```
 */
export const playDialogue = (
  actorName: string,
  text: string,
  soundName?: string
) => {
  const { cutscene } = getUiInterface().appState;
  let speaker = CutsceneSpeaker.None;
  actorName = actorName.toLowerCase();
  if (cutscene.portraitLeft === actorName) {
    speaker = CutsceneSpeaker.Left;
  } else if (cutscene.portraitLeft2 === actorName) {
    speaker = CutsceneSpeaker.Left2;
  } else if (cutscene.portraitRight === actorName) {
    speaker = CutsceneSpeaker.Right;
  } else if (cutscene.portraitRight2 === actorName) {
    speaker = CutsceneSpeaker.Right2;
  } else if (cutscene.portraitCenter === actorName) {
    speaker = CutsceneSpeaker.Center;
  }
  setCutsceneText(text, speaker);
  return waitForUserInput();
};

/**
 * Starts a cutscene where the two provided actor names' portraits are displayed on the
 * left and the right respectively.
 *
 * NOTE: The given names must have a portrait animation specified for them.
 * For example "Ada" has an animation specified "ada_portrait" in
 * the "res.txt" file:
 *
 * ```
 * Picture,ada512,ada512.png,512,512
 * Animation,ada_portrait,true
 * ```
 *
 * If a conversation is not already happening, this pops up the cutscene bars on top and
 * bottom, and also slides the character portraits up from the bottom.
 *
 * Example test case:
 * ```
 * @test-setConversation2
 * +setConversation2('Ada', 'Conscience');
 * Ada: "This script tests `setConversation2`."
 * Ada: "Conscience and I should be speaking now."
 * Conscience: "Well... not at the same time, but you should see both of us at least."
 * Ada: "The conversation will now end, then start again."
 * +endConversation();
 * +setConversation2('Conscience', 'Ada');
 * Conscience: "Tadaa!  We're back!"
 * Ada: "And it appears we have switched places."
 * Conscience: "Weird."
 * Conscience: "The test will now conclude."
 * +endConversation();
 * ```
 *
 * ![Example Image](../res/docs/setConversation2Example.png)
 */
export const setConversation2 = (
  actorNameLeft: string,
  actorNameRight: string
) => {
  startConversation2(
    `${actorNameLeft.toLowerCase()}`,
    `${actorNameRight.toLowerCase()}`
  );
  return waitMS(500);
};

/**
 * Starts a cutscene where the provided actor name's portrait is displayed on the left
 * and their text box is displayed on the right.
 *
 * NOTE: The given names must have a portrait animation specified for it.
 * For example "Ada" has an animation specified "ada_portrait" in the "res.txt" file:
 *
 * ```
 * Picture,ada512,ada512.png,512,512
 * Animation,ada_portrait,true
 * ```
 *
 * If a conversation is not already happening, this pops up the cutscene bars on top and
 * bottom, and also slides the character portrait up from the bottom-left.
 *
 * Example test case:
 * ```
 * @test-setConversation
 * +setConversation('Ada');
 * Ada: "This script tests `setConversation`."
 * Ada: "Only one person should be speaking now."
 * Ada: "The conversation will now end, then start again."
 * +endConversation();
 * +setConversation('Conscience');
 * Conscience: "Tadaa!  It's me now!"
 * Conscience: "The test will now conclude."
 * +endConversation();
 * ```
 *
 *![Example Image](../res/docs/setConversation1Example.png)
 *
 *
 */
export const setConversation = (actorName: string) => {
  startConversation(`${actorName.toLowerCase()}`);
  return waitMS(100);
};

/**
 * Removes all portraits and cutscene bars from the screen.  Portraits slide downwards,
 * and cutscene bars slide off.  After an optionally specified number of milliseconds,
 * this function resumes executing the script. This number defaults to 1 second
 * if not provided.
 */
export const endConversation = (ms?: number) => {
  setCutsceneText('');
  hideConversation();
  return waitMS(ms ?? 1000);
};

/**
 * This sets which portrait is rendered as "active".  For example, this moves the portrait
 * on the left to the forefront and with 100% opacity, pushing all other portraits away
 * and setting their opacity to be semi-transparent.
 *
 * Values for the speaker can be one of the following:
 *
 * ```
 * "left"
 * "left2"
 * "right"
 * "right2"
 * "center"
 * "none"
 * ```
 *
 * setConversationSpeaker is implicitly called when specifying a character who is
 * speaking, with the normal syntax (`Conscience: "We should help her!"`)
 *
 * ![Example Image](../res/docs/setSpeakerLeftExample.png)
 *
 * This pushes every other portrait to the side, setting their opacity to be semi-transparent.
 *
 * ```
 * @test-setConversationSpeaker
 * +setConversation2('Ada', 'Conscience');
 * Ada: "This script tests `setConversationSpeaker`."
 * Conscience: "We are both speaking now, but after this dialog, a spooky disembodied voice will say something!"
 * // Note: specifying any label that isn't part of the conversation implicitly calls setConversationSpeaker('none')
 * // In this case "Other" is not in the conversation
 * Other: "WELL. WELL. WELL.  WHAT DO WE HAVE HERE?"
 * // Note: calling setConversationSpeaker directly will remove the dialog box.
 * +setConversationSpeaker('none');
 * +waitMS(1500);
 * +setConversationSpeaker('left');
 * +waitMS(1000);
 * Ada: "Who was that?"
 * Conscience: "I don't know!  Is this part of the test?"
 * Ada: "Perhaps we should... abort the sequence.  Now!"
 * Conscience: "The test w-w-w-ill now conclude!!"
 * +endConversation();
 * ```
 *
 * ![Example Image](../res/docs/setSpeakerExample.png)
 */
export const setConversationSpeaker = (speaker: CutsceneSpeaker) => {
  setCutsceneText('', speaker);
};

/**
 * Waits for the specified number of milliseconds, ignoring all user input until that time.
 *
 * The `cb` argument is not to be used in rpgscript, and only for internal use.
 */
export const waitMS = (ms: number, cb?: () => void) => {
  const scene = getCurrentScene();
  scene.isWaitingForTime = true;
  clearTimeout(scene.waitTimeoutId);
  scene.waitTimeoutId = setTimeout(() => {
    scene.isWaitingForTime = false;
    if (cb) {
      cb();
    }
  }, ms) as any;
  return true;
};

/**
 * Waits for the specified number of milliseconds, but can be interrupted by a user pressing
 * the action key.
 *
 * The `cb` argument is not to be used in rpgscript, and only for internal use.
 *
 * ```
 * @test-waitMSPreemptible
 * +setConversation('Conscience');
 * Conscience: "This script tests waitMSPreemptible."
 * Conscience: "I will now stare awkwardly for 10 seconds.  At any time you may interrupt me and I will resume my normal, suave functionality."
 * +setConversationSpeaker('center');
 * +waitMSPreemptible(10000);
 * Conscience: "Boom!  I'm back."
 * Conscience: "The test will now conclude."
 * +endConversation();
 * ```
 */
export const waitMSPreemptible = (ms: number, cb: () => void) => {
  const scene = getCurrentScene();
  const keyHandler = (ev: KeyboardEvent) => {
    switch (ev.key) {
      case 'Return':
      case 'Enter':
      case ' ': {
        clearTimeout(scene.waitTimeoutId);
        popKeyHandler(keyHandler);
        _cb();
        break;
      }
    }
  };
  pushKeyHandler(keyHandler);
  const _cb = () => {
    scene.isWaitingForTime = false;
    if (cb) {
      cb();
    }
    popKeyHandler(keyHandler);
  };
  scene.isWaitingForTime = true;
  clearTimeout(scene.waitTimeoutId);
  scene.waitTimeoutId = setTimeout(_cb, ms) as any;
  return true;
};

/**
 * (Internal use only.)
 */
const waitUntil = () => {
  const scene = getCurrentScene();
  scene.isWaitingForTime = true;
  return () => {
    scene.isWaitingForTime = false;
  };
};

/**
 * (Internal use only.)
 */
const waitForUserInput = (cb?: () => void) => {
  const scene = getCurrentScene();
  scene.isWaitingForInput = true;

  const keyHandler = (ev: KeyboardEvent) => {
    switch (ev.key) {
      case 'Return':
      case 'Enter':
      case ' ': {
        clearTimeout(scene.waitTimeoutId);
        popKeyHandler(keyHandler);
        _cb();
        break;
      }
    }
  };
  pushKeyHandler(keyHandler);
  const _cb = () => {
    scene.isWaitingForInput = false;
    if (cb) {
      cb();
    }
    popKeyHandler(keyHandler);
  };

  return _cb;
};

/**
 * Sets a key/value pair on a player's save file.  Useful setting variables.
 */
export const setStorage = (key: string, value: string) => {
  const scene = getCurrentScene();
  scene[key] = value;
};

/**
 * Call another script.  This line waits for the script to return before invoking
 * the next line.
 *
 * ```
 * @test-callScript
 * +setConversation('Conscience');
 * Conscience: "This script tests `callScript`."
 * Conscience: "After this dialog, a call will be made to another script where Ada will pop in, then I shall return!"
 * +endConversation();
 * +callScript('test-callScript2');
 * +setConversation('Conscience');
 * Conscience: "Hey again!"
 * Conscience: "The test will now conclude."
 * +endConversation();
 *
 * @test-callScript2
 * +setConversation('Ada');
 * Ada: "Okay, I am here now."
 * Ada: "I suppose that means the test is working."
 * Ada: "You may now see Conscience again."
 * +endConversation();
 * ```
 *
 */
export const callScript = (scriptName: string) => {
  const scene = getCurrentScene();
  sceneCallScript(scene, scriptName);
  return true;
};

/**
 * Sets the given character to be facing another character.  Both characters must be
 * present in the room for this to work.
 */
export const lookAtCharacter = (chName: string, targetChName: string) => {
  const room = getCurrentRoom();
  const ch = roomGetCharacterByName(room, chName);
  const ch2 = roomGetCharacterByName(room, targetChName);

  if (!ch) {
    console.error('Could not find character with name: ' + chName);
    return;
  }
  if (!ch2) {
    console.error('Could not find target character with name: ' + targetChName);
    return;
  }

  if (ch && ch2) {
    const point1 = characterGetPosCenterPx(ch);
    const point2 = characterGetPosCenterPx(ch2);
    const angle = getAngleTowards(point1, point2);
    characterSetFacingFromAngle(ch, angle);
  }
};

/**
 * Sets the given character to be facing a marker.  Both the character and marker
 * must be present in the room for this to work.
 */
export const lookAtMarker = (chName: string, markerName: string) => {
  const room = getCurrentRoom();
  const ch = roomGetCharacterByName(room, chName);
  const marker = room.markers[markerName];

  if (!ch) {
    console.error('Could not find character with name: ' + chName);
    return;
  }
  if (!marker) {
    console.error('Could not find target marker with name: ' + markerName);
    return;
  }

  if (ch && marker) {
    const point1 = characterGetPosCenterPx(ch);
    const point2 = [marker.x, marker.y] as Point;
    const angle = getAngleTowards(point1, point2);
    characterSetFacingFromAngle(ch, angle);
  }
};

/**
 * A shortcut command for double `lookAtCharacter` calls.
 * 
 * This command:
 * 
 * ```
 * lookAtEachOther("Ada", "Conscience");
 * ```
 *
 * Is the same as:
 * 
 * ```
 * +lookAtCharacter("Ada", "Conscience");
 * +lookAtCharacter("Conscience", "Ada");
 * ```
 */
export const lookAtEachOther = (chName1: string, chName2: string) => {
  lookAtCharacter(chName1, chName2);
  lookAtCharacter(chName2, chName1);
};

/**
 * Sets the given character to be facing a direction.  The direction can be one of:
 *
 * ```
 * "up"
 * "down"
 * "left"
 * "right" (left_f)
 * "leftup"
 * "leftdown"
 * "rightup" (leftup_f)
 * "rightdown" (leftdown_f)
 * ```
 *
 * The character name provided must be defined in the character database and in the current
 * room.
 *
 * ```
 * // set facing for "Ada" to be up and left
 * +setFacing("Ada", "leftup");
 * ```
 */
export const setFacing = (chName: string, facing: Facing) => {
  const ch = roomGetCharacterByName(getCurrentRoom(), chName);
  if (ch) {
    if (facing === Facing.RIGHT2) {
      facing = Facing.RIGHT;
    } else if (facing === Facing.RIGHT_UP2) {
      facing = Facing.RIGHT_UP;
    } else if (facing === Facing.RIGHT_DOWN2) {
      facing = Facing.RIGHT_DOWN;
    }
    characterSetFacing(ch, facing);
  } else {
    console.error(
      'Cannot set facing, no character named:',
      chName,
      'facing=',
      facing
    );
  }
};

/**
 * Shakes the screen for the given number of milliseconds, defaults to 1 second if not provided.
 *
 * ```
 * // shake screen for 500 milliseconds
 * +shakeScreen(500);
 * ```
 */
export const shakeScreen = (ms?: number) => {
  const canvasContainer = document.getElementById('canvas-container');
  if (canvasContainer) {
    canvasContainer.className = 'shake';
  }
  return waitMS(ms ?? 1000, () => {
    if (canvasContainer) {
      canvasContainer.className = '';
    }
  });
};

/**
 * Sets the given character at the position (x, y), where x and y are in world coordinates
 * (not Tile coordinates).  'z' is an optional param which defaults to 0.
 *
 * ```
 * // set Ada at position 100, 100, in the current room
 * +setCharacterAt("Ada", 100, 100);
 * ```
 */
export const setCharacterAt = (
  chName: string,
  x: number,
  y: number,
  z?: number
) => {
  const room = getCurrentRoom();
  const ch = roomGetCharacterByName(room, chName);
  if (!ch) {
    console.error('Could not find character with name: ' + chName);
    return;
  }
  if (ch) {
    characterSetPos(ch, [x, y, z ?? 0]);
  }
};

/**
 * Starts the given character moving towards a marker.  They will move in a straight line
 * directly at the marker until the reach it. Specifically this means that their FEET will
 * be within a 4 pixel radius at the bottom of the marker. Once that character reaches the
 * destination, the next line in the script is invoked.
 * 
 * Here Ada has walked to the marker, and her feet at the bottom, where it points.
 * 
 * ![Example Image](../res/docs/AdaAtMarker.png)
 *
 * Optional params (xOffset, yOffset) can be provided to change the final destination of
 * the character.  This is useful for telling multiple characters to walk towards a marker
 * but don't want them all standing in exactly the same spot.
 *
 * Optional param skipWait may be set to `true` if the cutscene should set the character
 * to walk towards the marker, but not wait for that character to reach their destination
 * before the next line in the script is invoked.
 *
 * For example, if it is desired to have two characters walk simultaneously together:
 *
 * ```
 * +walkToMarker("Ada", "MarkerA", 0, 0, true);
 * +walkToMarker("Conscience", "MarkerA", 16, 0);
 * // This accounts for some cases where the offset might make Ada move slower/faster than
 * // Conscience.
 * +waitMS(100);
 * ```
 *
 * NOTE: If a character cannot reach the intended location, then they will 
 * get warped there by the game engine.
 */
export const walkToMarker = (
  chName: string,
  markerName: string,
  xOffset?: number,
  yOffset?: number,
  skipWait?: boolean
) => {
  const room = getCurrentRoom();
  const ch = roomGetCharacterByName(room, chName);
  const marker = room.markers[markerName];

  if (!ch) {
    console.error('Could not find character with name: ' + chName);
    return;
  }
  if (!marker) {
    console.error('Could not find target marker with name: ' + markerName);
    return;
  }

  if (ch && marker) {
    // this offset puts the character's feet on the bottom of the marker
    const target = [
      marker.x + (xOffset ?? 0),
      marker.y + (yOffset ?? 0),
    ] as Point;

    if (skipWait) {
      characterSetWalkTarget(ch, target, () => void 0);
    } else {
      characterSetWalkTarget(ch, target, waitUntil());
      return true;
    }
  }
};

const commands = {
  playDialogue,
  setConversation2,
  setConversation,
  endConversation,
  setConversationSpeaker,
  waitMS,
  waitMSPreemptible,
  waitUntil,
  waitForUserInput,
  setStorage,
  callScript,
  lookAtCharacter,
  lookAtMarker,
  lookAtEachOther,
  setFacing,
  shakeScreen,
  setCharacterAt,
  walkToMarker,
};

export default commands;
