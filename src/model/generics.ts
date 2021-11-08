import { Point } from 'utils';
import { Room } from 'model/room';
import { Player } from 'model/player';
import { Battle } from 'model/battle';
import { Overworld } from 'model/overworld';
import { Scene } from 'model/scene';
import { ParticleSystem } from 'model/particle-system';
import { Timer, Transform } from './utility';
import { Character } from 'model/character';
import {
  setVolumeForActiveSounds,
  setVolumeForMusic,
  SoundType,
} from './sound';

let currentRoom: Room | null = ((window as any).room = null);
export const getCurrentRoom = (): Room => currentRoom as Room;
export const setCurrentRoom = (r: Room): void => {
  currentRoom = (window as any).room = r;
};

let currentBattle: null | Battle = ((window as any).battle = null);
export const getCurrentBattle = (): Battle => currentBattle as Battle;
export const setCurrentBattle = (b: Battle | null): void => {
  currentBattle = (window as any).battle = b;
};

let currentOverworld: null | Overworld = ((window as any).overworld = null);
export const getCurrentOverworld = (): Overworld =>
  currentOverworld as Overworld;
export const setCurrentOverworld = (o: Overworld | null): void => {
  currentOverworld = (window as any).overworld = o;
};

let currentScene: null | Scene = ((window as any).scene = null);
export const getCurrentScene = (): Scene => currentScene as Scene;
export const setCurrentScene = (s: Scene | null): void => {
  currentScene = (window as any).scene = s;
};

let currentPlayer: Player | null = ((window as any).player = null);
export const getCurrentPlayer = (): Player => currentPlayer as Player;
export const setCurrentPlayer = (p: Player): void => {
  currentPlayer = (window as any).player = p;
};

let now = 0;
export const getNow = (): number => now;
export const setNow = (n: number): void => {
  now = n;
};

let deltaT = 0;
export const getDeltaT = (): number => deltaT;
export const setDeltaT = (n: number): void => {
  deltaT = n;
};

let frameMultiplier = 0;
export const getFrameMultiplier = (): number => frameMultiplier;
export const setFrameMultiplier = (n: number): void => {
  frameMultiplier = n;
};

let mousePos = [0, 0] as Point;
export const getMousePos = (): Point => mousePos;
export const setMousePos = (x: number, y: number): void => {
  mousePos = [x, y];
};

const keyState: { [key: string]: boolean } = {};
export const setKeyDown = (key: string): void => {
  keyState[key] = true;
};
export const setKeyUp = (key: string): void => {
  keyState[key] = false;
};
export const isKeyDown = (key: string): boolean => {
  return keyState[key] ?? false;
};

let isPaused = ((window as any).isPaused = false);
export const getIsPaused = (): boolean => isPaused;
export const setIsPaused = (n: boolean): void => {
  // console.trace('set paused', n);
  isPaused = (window as any).isPaused = n;
};

const renderables: Record<
  string,
  () => void
> = ((window as any).renderables = {});
export const addRenderable = (name: string, cb: () => void): void => {
  renderables[name] = cb;
};
export const removeRenderable = (name: string) => {
  delete renderables[name];
};
export const getRenderables = (): Record<string, () => void> => {
  return renderables;
};

let keyUpdateEnabled = true;
export const getKeyUpdateEnabled = (): boolean => keyUpdateEnabled;
export const enableKeyUpdate = (): void => {
  keyUpdateEnabled = true;
};
export const disableKeyUpdate = (): void => {
  keyUpdateEnabled = false;
};

let triggersVisible = false;
export const getTriggersVisible = (): boolean => triggersVisible;
export const showTriggers = () => (triggersVisible = true);
export const hideTriggers = () => (triggersVisible = false);

let markersVisible = false;
export const getMarkersVisible = (): boolean => markersVisible;
export const showMarkers = () => (markersVisible = true);
export const hideMarkers = () => (markersVisible = false);

let renderBackgroundColor = 'black';
export const getRenderBackgroundColor = (): string => renderBackgroundColor;
export const setRenderBackgroundColor = (color: string) =>
  (renderBackgroundColor = color);

let soundEnabled = true;
export const getSoundEnabled = () => soundEnabled;
export const setSoundEnabled = (v: boolean) => (soundEnabled = v);

const volumeLevels = {
  [SoundType.NORMAL]: 0.5,
  [SoundType.MUSIC]: 0.25,
};
export const setVolume = (type: SoundType, volumeDecimal: number) => {
  if (volumeDecimal > 1) {
    volumeDecimal = 1;
  }
  if (volumeDecimal < 0) {
    volumeDecimal = 0;
  }
  volumeLevels[type] = volumeDecimal;
  if (type === SoundType.MUSIC) {
    setVolumeForMusic(volumeDecimal);
  } else {
    setVolumeForActiveSounds(volumeDecimal);
  }
};
export const getVolume = (type: SoundType) => {
  return volumeLevels[type] ?? 1;
};

let arcadeGameVolume = 100;
export const setArcadeGameVolume = (pct: number) => {
  arcadeGameVolume = pct > 100 ? 100 : pct < 0 ? 0 : pct;
};
export const getArcadeGameVolume = () => arcadeGameVolume;

let arcadeGameMuted = false;
export const setArcadeGameMuted = (v: boolean) => {
  arcadeGameMuted = v;
};
export const isArcadeGameMuted = () => arcadeGameMuted;

let cameraDrawOffset: Point = [0, 0];
export const getCameraDrawOffset = () => cameraDrawOffset;
export const setCameraDrawOffset = (p: Point) => (cameraDrawOffset = p);

let cameraTransform: Transform | null = null;
export const getCameraTransform = () => cameraTransform;
export const setCameraTransform = (t: Transform | null) =>
  (cameraTransform = t);

const timers: Timer[] = [];
export const addTimer = (...timersToAdd: Timer[]) => {
  timersToAdd.forEach(t => {
    if (timers.indexOf(t) === -1) {
      timers.push(t);
    }
  });
};
export const removeTimer = (...timersToRemove: Timer[]) => {
  timersToRemove.forEach(t => {
    const ind = timers.indexOf(t);
    if (ind > -1) {
      timers.splice(ind, 1);
    }
  });
};
export const getAllTimers = () => timers;

let globalParticleSystem: ParticleSystem | null = null;
export const getGlobalParticleSystem = () => globalParticleSystem;
export const setGlobalParticleSystem = (ps: ParticleSystem | null) =>
  (globalParticleSystem = ps);

let playerWallGlowEnabled = true;
export const getPlayerWallGlowEnabled = () => playerWallGlowEnabled;
export const setPlayerWallGlowEnabled = (b: boolean) =>
  (playerWallGlowEnabled = b);

let pauseRendering = false;
export const enablePauseRendering = () => (pauseRendering = true);
export const disablePauseRendering = () => (pauseRendering = false);
export const isPauseRenderingEnabled = () => pauseRendering;

let useZip = true;
export const shouldUseZip = () => useZip;
export const setUseZip = (v: boolean) => (useZip = v);

let timeLoaded = +new Date();
export const getTimeLoaded = () => timeLoaded;
export const setTimeLoaded = (s: number) => {
  timeLoaded = s;
};

let durationPlayed = 0;
export const getDurationPlayed = () => durationPlayed;
export const setDurationPlayed = (s: number) => {
  durationPlayed = s;
};

let showOnScreenControls = true;
export const shouldShowOnScreenControls = () => showOnScreenControls;
export const setShowOnScreenControls = (v: boolean) =>
  (showOnScreenControls = v);

const charactersWithSuspendedAi: Character[] = [];
export const addCharacterWithSuspendedAi = (ch: Character) => {
  charactersWithSuspendedAi.push(ch);
};
export const removeCharacterWithSuspendedAi = (ch: Character) => {
  const ind = charactersWithSuspendedAi.indexOf(ch);
  if (ind > -1) {
    charactersWithSuspendedAi.splice(ind, 1);
  }
};
export const getCharactersWithSuspendedAi = () => [
  ...charactersWithSuspendedAi,
];

let overworldUpdateKeysDisabled = false;
export const setOverworldUpdateKeysDisabled = (v: boolean) => {
  overworldUpdateKeysDisabled = v;
};
export const isOverworldUpdateKeysDisabled = () => overworldUpdateKeysDisabled;

let debugModeEnabled = true;
export const setDebugModeEnabled = (v: boolean) => (debugModeEnabled = v);
export const isDebugModeEnabled = () => debugModeEnabled;

let cutsceneSpeed = 1.0;
export const setCutsceneSpeedMultiplier = (v: number) => {
  cutsceneSpeed = v;
};
export const getCutsceneSpeedMultiplier = () => {
  return cutsceneSpeed;
};
