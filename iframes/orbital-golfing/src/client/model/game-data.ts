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
}

type ScorecardData = Record<string, []>;

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
}

interface PlayerEntityData extends EntityData {
  angle: number;
  interval: number;
  power: number;
  coins: number;
  color: string;
  finished: boolean;
  active: boolean;
}

interface PlanetEntityData extends EntityData {
  color: string;
}

let currentGameData: GameData | null = null;
const getGameData = () => currentGameData;
const setGameData = (data: GameData | null) => (currentGameData = data);
