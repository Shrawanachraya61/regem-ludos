import { AppSection, CutsceneSpeaker } from 'model/store';
import {
  characterSetFacing,
  characterSetPos,
  characterGetPos,
  Facing,
  AnimationState,
} from 'model/character';
import { Marker, roomGetCharacterByName } from 'model/room';
import {
  getCurrentScene,
  getCurrentRoom,
  getCurrentPlayer,
} from 'model/generics';
import { Point, Point3d } from 'utils';
import { EmotionBubble } from 'db/particles';
import { getIfExists as getItem } from 'db/items';
import {
  playerAddItem,
  playerRemoveItem,
  playerModifyTokens,
  playerModifyTickets,
} from 'model/player';
import { ParticleTemplate } from 'model/particle';
import SC from './scene-commands';
import {
  hideConversation,
  setCutsceneText,
  showChoices,
  showSection,
} from 'controller/ui-actions';

export const playDialogue = (
  actorName: string,
  text: string,
  soundName?: string
) => {
  console.log('SKIP DIALOG', actorName, text);
  return;
};

export const setConversation2 = (
  actorNameLeft: string,
  actorNameRight: string
) => {
  return;
};

export const setConversation = (actorName: string) => {
  return;
};

export const setConversationWithoutBars = (actorName: string) => {
  return;
};

export const endConversation = (ms?: number, hideCutscene?: boolean) => {
  setCutsceneText('');
  hideConversation();
  showSection(AppSection.Debug, true);
};

export const setConversationSpeaker = (speaker: CutsceneSpeaker) => {
  return;
};

export const none = () => {
  setConversationSpeaker(CutsceneSpeaker.None);
};

export const setFromDialog = (chName: string) => {
  return;
};

/**
 * Waits for the specified number of milliseconds, ignoring all user input until that time.
 *
 * The `cb` argument is not to be used in rpgscript, and only for internal use.
 */
export const waitMS = (ms: number, cb?: () => void) => {
  return;
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
  return;
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
  return;
};

/**
 * (Internal use only.)
 */
const waitForUserInputDialog = (cb?: () => void) => {
  return;
};

/**
 * Sets a key/value pair on a player's save file.  Useful setting variables.
 */
export const setStorage = (key: string, value: string | boolean) => {
  if (value === 'false') {
    value = false;
  }
  console.log('Set Storage', key, value ?? true);
  const scene = getCurrentScene();
  scene.storage[key] = value ?? true;
};

export const callScript = (scriptName: string, ...args: any[]) => {
  SC.callScript(scriptName, ...args);
  return true;
};

export const lookAtCharacter = (chName: string, targetChName: string) => {
  SC.lookAtCharacter(chName, targetChName);
};

export const lookAtMarker = (chName: string, markerName: string) => {
  SC.lookAtMarker(chName, markerName);
};

export const lookAtEachOther = (chName1: string, chName2: string) => {
  lookAtCharacter(chName1, chName2);
  lookAtCharacter(chName2, chName1);
};

export const setFacing = (chName: string, facing: Facing) => {
  SC.setFacing(chName, facing);
};

export const shakeScreen = (ms?: number) => {
  return;
};

export const setCharacterAt = (
  chName: string,
  x: number,
  y: number,
  z?: number
) => {
  SC.setCharacterAt(chName, x, y, z);
};

export const offsetCharacter = (
  chName: string,
  x: number,
  y: number,
  z?: number
) => {
  SC.offsetCharacter(chName, x, y, z);
};

export const walkToMarker = (
  chName: string,
  markerName: string,
  xOffset?: number,
  yOffset?: number,
  skipWait?: boolean
) => {
  SC.setAtMarker(chName, markerName, xOffset, yOffset);
};

export const walkToCharacter = (
  chName: string,
  chName2: string,
  xOffset?: number,
  yOffset?: number,
  skipWait?: boolean
) => {
  const room = getCurrentRoom();
  const ch = roomGetCharacterByName(room, chName);
  const ch2 = roomGetCharacterByName(room, chName2);

  if (!ch) {
    console.error('Could not find character with name: ' + chName);
    return;
  }
  if (!ch2) {
    console.error('Could not find target ch with name: ' + chName2);
    return;
  }
  if (xOffset !== undefined && typeof xOffset !== 'number') {
    console.error('xOffset is not a number');
    return;
  }
  if (yOffset !== undefined && typeof yOffset !== 'number') {
    console.error('yOffset is not a number');
    return;
  }

  const [pX, pY] = characterGetPos(ch2);
  const target = [pX + (xOffset ?? 0), pY + (yOffset ?? 0)] as Point;
  setCharacterAt(chName, target[0], target[1], 0);
};

export const setAtMarker = (
  chName: string,
  markerName: string,
  xOffset?: number,
  yOffset?: number
) => {
  SC.setAtMarker(chName, markerName, xOffset, yOffset);
};

export const walkToOffset = (
  chName: string,
  xOffset: number,
  yOffset: number,
  skipWait?: boolean
) => {
  const room = getCurrentRoom();
  const ch = roomGetCharacterByName(room, chName);

  if (!ch) {
    console.error('Could not find character with name: ' + chName);
    return;
  }
  if (xOffset !== undefined && typeof xOffset !== 'number') {
    console.error('xOffset is not a number');
    return;
  }
  if (yOffset !== undefined && typeof yOffset !== 'number') {
    console.error('yOffset is not a number');
    return;
  }

  const target = [ch.x + xOffset, ch.y + yOffset] as Point;
  setCharacterAt(chName, target[0], target[1], 0);
};

export const setCharacterAtMarker = (
  chName: string,
  markerName: string,
  xOffset?: number,
  yOffset?: number
) => {
  SC.setCharacterAtMarker(chName, markerName, xOffset, yOffset);
};

export const changeTileAtMarker = (
  markerName: string | Marker,
  tileTemplateName: string,
  xOffset?: number,
  yOffset?: number
) => {
  SC.changeTileAtMarker(markerName, tileTemplateName, xOffset, yOffset);
};

export const removeWallAtMarker = (
  markerName: string,
  xOffset?: number,
  yOffset?: number
) => {
  SC.removeWallAtMarker(markerName, xOffset, yOffset);
};

export const removeWallAtTilePosition = (tileX: number, tileY: number) => {
  SC.removeWallAtTilePosition(tileX, tileY);
};

export const spawnCharacterAtCharacter = (
  chTemplateName: string,
  chName: string,
  xOffset?: number,
  yOffset?: number
) => {
  SC.spawnCharacterAtCharacter(chTemplateName, chName, xOffset, yOffset);
};

export const spawnCharacterAtMarker = (
  chTemplateName: string,
  markerName: string,
  xOffset?: number,
  yOffset?: number
) => {
  SC.spawnCharacterAtMarker(chTemplateName, markerName, xOffset, yOffset);
};

export const spawnPartyMembers = () => {
  SC.spawnPartyMembers(true);
};

export const despawnPartyMembers = () => {
  SC.despawnPartyMembers(true);
};

export const spawnPartyMembersInFormation = () => {
  const room = getCurrentRoom();
  const player = getCurrentPlayer();
  const partyWithoutLeader = player.partyStorage.filter(
    ch => ch !== player.leader
  );

  const d = 16;
  const offsets = [
    [d, 1],
    [1, -d],
    [-d, 1],
    [1, d],
  ];

  partyWithoutLeader.forEach((chTemplate, i) => {
    const offset = offsets[i];
    spawnCharacterAtCharacter(
      chTemplate.name,
      player.leader.name,
      offset?.[0],
      offset?.[1]
    );
  });

  player.party.forEach(chTemplate => {
    const ch = roomGetCharacterByName(room, chTemplate.name);
    if (ch) {
      characterSetFacing(ch, Facing.DOWN);
    }
  });
};

export const despawnCharacter = (chName: string) => {
  SC.despawnCharacter(chName);
};

export const fadeOut = (ms?: number, skipWait?: boolean) => {
  const canvasContainer = document.getElementById('fade');
  if (canvasContainer) {
    canvasContainer.style.transition = `unset`;
    canvasContainer.style['background-color'] = 'rgba(0, 0, 0, 255)';
  }
};

export const fadeIn = (ms?: number, skipWait?: boolean) => {
  const canvasContainer = document.getElementById('fade');
  if (canvasContainer) {
    canvasContainer.style.transition = `unset`;
    canvasContainer.style['background-color'] = 'rgba(0, 0, 0, 0)';
  }
};

export const fadeOutColor = (
  r: number,
  g: number,
  b: number,
  ms?: number,
  skipWait?: boolean
) => {
  const canvasContainer = document.getElementById('fade');
  if (canvasContainer) {
    canvasContainer.style.transition = `unset`;
    canvasContainer.style['background-color'] = `rgba(${r}, ${g}, ${b}, 255)`;
  }
};

export const fadeInColor = (
  r: number,
  g: number,
  b: number,
  ms?: number,
  skipWait?: boolean
) => {
  const canvasContainer = document.getElementById('fade');
  if (canvasContainer) {
    canvasContainer.style.transition = `unset`;
    canvasContainer.style['background-color'] = `rgba(${r}, ${g}, ${b}, 0)`;
  }
};

export const changeRoom = async (
  roomName: string,
  nextRoomMarkerName?: string
) => {
  SC.changeRoom(roomName, nextRoomMarkerName);
};

export const acquireItem = (itemName: string, itemText?: string) => {
  const player = getCurrentPlayer();
  const item = getItem(itemName);
  if (!item) {
    console.error(
      `Cannot acquire item "${itemName}" no template exists with that name.`
    );
    return;
  }

  playerAddItem(player, itemName);
};

export const acquireQuestItem = (itemName: string, itemText?: string) => {
  const player = getCurrentPlayer();
  playerAddItem(player, itemName);
};

export const removeItem = (itemName: string, itemText?: string) => {
  const player = getCurrentPlayer();
  playerRemoveItem(player, itemName);
};

export const modifyTokens = (amount: number) => {
  const player = getCurrentPlayer();
  playerModifyTokens(player, amount);
};

export const modifyTickets = (amount: number) => {
  const player = getCurrentPlayer();
  playerModifyTickets(player, amount);
};

export const jump = (chName: string) => {
  return;
};

export const applyZTransform = (chName: string, z: number, ms?: number) => {
  const room = getCurrentRoom();
  const ch = roomGetCharacterByName(room, chName);

  if (!ch) {
    console.error('Could not find character with name: ' + chName);
    return;
  }

  const startPoint = characterGetPos(ch);
  const endPoint = [...startPoint] as Point3d;
  endPoint[2] += z;

  characterSetPos(ch, endPoint);
};

export const runArcadeCabinetGame = (gameName: string) => {
  SC.runArcadeCabinetGame(gameName);
};

export const setAnimationAndWait = (
  chName: string,
  animName: string,
  msOffset?: number
) => {
  return;
};

export const setAnimation = (chName: string, animName: string) => {
  SC.setAnimation(chName, animName);
};

export const setAnimationState = (chName: string, state: AnimationState) => {
  SC.setAnimationState(chName, state);
};

export const resetAi = (chName: string) => {
  SC.resetAi(chName);
};
export const startAi = resetAi;

export const stopAi = (chName: string) => {
  SC.stopAi(chName);
};

export const setDoorStateAtMarker = (
  markerName: string,
  tileBase: string,
  doorDirection: string | 'BCK' | 'FWD',
  doorState: string | 'OPEN' | 'CLOSED'
) => {
  SC.setDoorStateAtMarker(markerName, tileBase, doorDirection, doorState);
};

export const awaitChoice = (...choices: string[]) => {
  setTimeout(() => {
    showChoices(choices);
  }, 250);
  return waitUntil();
};

export const enterCombat = (encounterName: string) => {
  return SC.enterCombat(encounterName);
};

export const addPartyMemberToActiveParty = (chName: string) => {
  SC.addPartyMemberToActiveParty(chName);
};

export const removePartyMemberFromActiveParty = (chName: string) => {
  SC.removePartyMemberFromActiveParty(chName);
};

export const panCameraRelativeToPlayer = (
  relX: number,
  relY: number,
  ms?: number,
  skipWait?: boolean
) => {
  // SC.panCameraRelativeToPlayer(relX, relY, 0, true);
};

export const panCameraBackToPlayer = (ms?: number, skipWait?: boolean) => {
  // SC.panCameraBackToPlayer(0, true);
};

export const panCameraToFitCharacters = (
  ms?: number,
  skipWait?: boolean,
  ...characterNames: string[]
) => {
  // SC.panCameraToFitCharacters(ms, true, ...characterNames);
};

export const playSound = (soundName: string) => {
  return;
};

export const playMusic = async (musicName: string) => {
  SC.playMusic(musicName);
};

export const stopMusic = async () => {
  SC.stopMusic();
};

export const spawnParticleAtTarget = (
  template: ParticleTemplate,
  target: Point,
  particleMethod: 'normal' | 'weighted' | 'rise'
) => {
  return;
};

export const spawnParticleAtCharacter = (
  particleName: string,
  chName: string,
  particleMethod: 'normal' | 'weighted' | 'rise'
) => {
  return;
};

export const spawnEmotionParticleAtCharacter = (
  chName: string,
  emotion: EmotionBubble
) => {
  return;
};

export const spawnParticleAtMarker = (
  particleName: string,
  markerName: string,
  particleMethod: 'normal' | 'weighted' | 'rise'
) => {
  return;
};

export const setCharacterText = (text: string) => {
  return;
};

export const showUISection = (sectionName: string, ...args: any[]) => {
  return SC.showUISection(sectionName, ...args);
};

export const pauseOverworld = () => {
  SC.pauseOverworld();
};

export const unpauseOverworld = () => {
  SC.unpauseOverworld();
};

export const equipWeaponOrArmor = (itemName: string, chName: string) => {
  return SC.equipWeaponOrArmor(itemName, chName);
};

export const setBattlePaused = (isPaused: string) => {
  SC.setBattlePaused(isPaused);
};

export const setAiState = (
  chName: string,
  aiStateKey: string,
  value: string | boolean
) => {
  SC.setAiState(chName, aiStateKey, value);
};

const startQuest = (questName: string) => {
  return SC.startQuest(questName);
};

const completeQuestStep = (questName: string, stepInd: number) => {
  return SC.completeQuestStep(questName, stepInd);
};

const showNotification = (
  text: string,
  type?: 'info' | 'success' | 'warning' | 'danger'
) => {
  SC.showNotification(text, type);
};

const modifyPartyHP = (v: number) => {
  SC.modifyPartyHP(v);
};

const disableAnimationSounds = () => {
  SC.disableAnimationSounds();
};

const enableAnimationSounds = () => {
  SC.enableAnimationSounds();
};

// CUSTOM --------------------------------------------------------------------------------

// Used in the tutorial room to toggle open/closed all doors with the color of the marker
export const floor1TutToggleColorDoors = (
  color: string,
  shouldChangeState: string
) => {
  SC.floor1TutToggleColorDoors(color, shouldChangeState);
};

const commands = {
  playDialogue,
  setConversation,
  setConversation2,
  setConversationWithoutBars,
  endConversation,
  setConversationSpeaker,
  none,
  setFromDialog,
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
  offsetCharacter,
  walkToMarker,
  walkToCharacter,
  setAtMarker,
  walkToOffset,
  setCharacterAtMarker,
  changeTileAtMarker,
  removeWallAtMarker,
  removeWallAtTilePosition,
  spawnCharacterAtCharacter,
  spawnCharacterAtMarker,
  spawnPartyMembersInFormation,
  spawnPartyMembers,
  despawnPartyMembers,
  despawnCharacter,
  fadeOut,
  fadeIn,
  fadeOutColor,
  fadeInColor,
  changeRoom,
  acquireItem,
  acquireQuestItem,
  removeItem,
  modifyTokens,
  modifyTickets,
  jump,
  applyZTransform,
  runArcadeCabinetGame,
  setAnimationAndWait,
  setAnimation,
  setAnimationState,
  resetAi,
  stopAi,
  startAi,
  setDoorStateAtMarker,
  awaitChoice,
  enterCombat,
  addPartyMemberToActiveParty,
  removePartyMemberFromActiveParty,
  panCameraRelativeToPlayer,
  panCameraBackToPlayer,
  panCameraToFitCharacters,
  playSound,
  playMusic,
  stopMusic,
  spawnParticleAtCharacter,
  spawnEmotionParticleAtCharacter,
  spawnParticleAtMarker,
  setCharacterText,
  showUISection,
  setBattlePaused,
  equipWeaponOrArmor,
  pauseOverworld,
  unpauseOverworld,
  setAiState,
  startQuest,
  completeQuestStep,
  showNotification,
  modifyPartyHP,
  disableAnimationSounds,
  enableAnimationSounds,

  // custom scripts
  floor1TutToggleColorDoors,
};

export default commands;
