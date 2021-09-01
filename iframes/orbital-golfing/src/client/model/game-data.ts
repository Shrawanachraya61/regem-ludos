interface GameData {
  id: string;
  lobbyId: string;
  width: number;
  height: number;
  entityMap: Record<string, EntityData>;
  scorecard: ScorecardData;
  timeCreated: number;
  timeStarted: number;
  players: string[];
  planets: string[];
  powerups: string[];
  flags: string[];
  round: number;
  numRounds: number;
  i: number;
  timestamp: number;
  collisions: [string, string][];
}

type ScorecardData = Record<string, number[]>;

interface EntityData {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  ax: number;
  ay: number;
  t: number;
  r: number;
  mass: number;
  active?: boolean;
}

interface PlayerEntityData extends EntityData {
  name: string;
  angle: number;
  interval: number;
  power: number;
  coins: number;
  color: string;
  finished: boolean;
  shotCt: number;
  active: boolean;
  disconnected: boolean;
}

interface PlanetEntityData extends EntityData {
  color: string;
}

let currentGameData: GameData | null = null;
const getGameData = () => currentGameData;
const setGameData = (data: GameData | null) => (currentGameData = data);

const getMyPlayerEntity = (gameData: GameData): PlayerEntityData => {
  return getShared().getEntity(gameData, getPlayerId());
};

const copyGameData = (gameData: GameData) =>
  JSON.parse(JSON.stringify(gameData));
