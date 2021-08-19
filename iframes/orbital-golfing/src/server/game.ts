interface Game {
  id: string;
  lobbyId: string;
  width: number;
  height: number;
  entityMap: Record<string, Entity>;
  scorecard: Scorecard;
  timeCreated: number;
  timeStarted: number;
  players: string[];
  planets: string[];
  powerups: string[];
  flags: string[];
  round: number;
}

type Scorecard = Record<string, []>;

interface Entity {
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

interface PlayerEntity extends Entity {
  angle: number;
  interval: number;
  power: number;
  coins: number;
  color: string;
  finished: boolean;
  active: boolean;
}

interface PlanetEntity extends Entity {
  color: string;
}

const gameStorage: Game[] = [];

const broadcastGameStatus = (game: Game, started?: boolean) => {
  game.players.map(playerGetById).forEach(player => {
    if (player?.socket) {
      sendIoMessage(
        player.socket,
        started ? getShared().G_S_GAME_STARTED : getShared().G_S_GAME_COMPLETE,
        { game }
      );
    }
  });
};
const broadcastGameData = (game: Game) => {
  game.players.map(playerGetById).forEach(player => {
    if (player?.socket) {
      sendIoMessage(player.socket, getShared().G_S_GAME_DATA, { game });
    }
  });
};

const gameCreate = (lobbyId: string, playerIds: string[]): Game => {
  const game: Game = {
    id: randomId(),
    lobbyId,
    width: 2019600000000,
    height: 2019600000000,
    entityMap: {},
    scorecard: playerIds.reduce((obj, id) => {
      obj[id] = [];
      return obj;
    }, {}),
    timeCreated: +new Date(),
    timeStarted: +new Date(),
    players: [],
    planets: [],
    powerups: [],
    flags: [],
    round: 0,
  };

  console.debug(`Game created ${gameToString(game)}`);
  gameStorage.push(game);

  gameCreatePlanet(game, 1077120000000, 1432170666667, 1e32, 'red');
  playerIds.forEach(id => {
    const player = playerGetById(id);
    if (player) {
      gameCreatePlayer(game, id, game.width / 2, game.height / 2, 'blue');
      player.gameId = game.id;
    }
  });

  broadcastGameStatus(game, true);

  return game;
};

const gameDestroy = (game: Game) => {
  const ind = gameStorage.indexOf(game);
  if (ind) {
    gameStorage.splice(ind, 1);
    const players = game.players.map(playerGetById);
    players.forEach(player => {
      if (player?.gameId) {
        player.gameId = '';
      }
    });
    console.debug(`Game destroyed ${gameToString(game)}`);
  }
};

const gameCreateEntity = (game: Game, id: string) => {
  const entity: Entity = {
    id,
    x: 0,
    y: 0,
    r: getShared().fromPx(25),
    vx: 0,
    vy: 0,
    ax: 0,
    ay: 0,
    t: 0,
    mass: 1,
  };
  game.entityMap[entity.id] = entity;
  return entity;
};

const gameCreatePlanet = (
  game: Game,
  x: number,
  y: number,
  mass: number,
  color: string
) => {
  const planet = gameCreateEntity(game, 'planet_' + randomId()) as PlanetEntity;
  planet.mass = mass;
  planet.x = x;
  planet.y = y;
  planet.mass = mass;
  planet.color = color;
  console.debug('- PlanetEntity created: ' + JSON.stringify(planet, null, 2));
  game.planets.push(planet.id);
};

const gameCreatePlayer = (
  game: Game,
  id: string,
  x: number,
  y: number,
  color: string
) => {
  const player = gameCreateEntity(game, id) as PlayerEntity;
  player.angle = 0;
  player.interval = 5000;
  player.power = 1;
  player.coins = 0;
  player.color = color;
  player.finished = false;
  player.active = false;
  player.x = x;
  player.y = y;
  console.debug('- PlayerEntity created: ' + JSON.stringify(player, null, 2));
  game.players.push(id);
};

const gameHasActivePlayers = (game: Game) => {
  const players = game.players.map(playerGetById);
  for (let i = 0; i < players.length; i++) {
    const player = players[i];
    if (player?.connected) {
      return true;
    }
  }
  return false;
};

const gameGetById = (id: string) => {
  return gameStorage.find(game => game.id === id);
};

const gameToString = (game: Game) => {
  return `Game: id=${game.id}`;
};
