interface Game {
  id: string;
  courseName: string;
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
  coins: string[];
  collisions: [string, string][];
  round: number;
  roundFinished: boolean;
  numRounds: number;
  intervalMs: number;
  intervalId: number;
  broadcastMs: number;
  broadcastId: number;
  broadcastCt: number;
}

interface GameBroadcast {
  id: string;
  i: number;
  entityMap: Record<string, Entity | PlayerEntity>;
  collisions: [string, string][];
  round: number;
  timestamp: number;
}

type Scorecard = Record<string, number[]>;
type EntityType = '' | 'Player' | 'Planet' | 'Flag' | 'Coin';

interface Entity {
  id: string;
  type: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  ax: number;
  ay: number;
  t: number;
  r: number;
  mass: number;
  mark?: boolean;
}

type Vec2 = [number, number];

interface PlayerEntity extends Entity {
  name: string;
  angle: number;
  power: number;
  coins: number;
  color: string;
  shotCt: number;
  finished: boolean;
  active: boolean;
  posHistoryI: number;
  posHistory: Vec2[];
  ms: number;
  disconnected: boolean;
}

interface PlanetEntity extends Entity {
  color: string;
}

interface CoinEntity extends Entity {
  removed: boolean;
}

interface ShotArgs {
  power: number;
  ms: number;
  angleDeg: number;
}

const gameStorage: Game[] = [];

const gameGetPartial = (game: Game): Partial<Game> => {
  const partialGame: Partial<Game> = {
    ...game,
    intervalMs: undefined,
    intervalId: undefined,
    broadcastMs: undefined,
    broadcastId: undefined,
    broadcastCt: undefined,
  };
  return partialGame;
};

const broadcastGameStatus = (game: Game, event: string) => {
  game.players.map(playerGetById).forEach(player => {
    if (player?.socket) {
      sendIoMessage(player.socket, event, { game: gameGetPartial(game) });
    }
  });
};

const broadcastPlayerDisconnected = (game: Game, playerId: string) => {
  game.players.map(playerGetById).forEach(player => {
    if (player?.socket) {
      sendIoMessage(player.socket, getShared().G_S_GAME_PLAYER_DISCONNECTED, {
        playerId,
      });
    }
  });
};

const broadcastGameEntityData = (game: Game) => {
  const broadcastData: GameBroadcast = {
    entityMap: {},
    id: game.id,
    i: game.broadcastCt,
    collisions: game.collisions,
    round: game.round,
    timestamp: +new Date(),
  };
  for (const i in game.entityMap) {
    const entity = game.entityMap[i];
    if (entity.mark) {
      broadcastData.entityMap[i] = {
        ...entity,
        // name: undefined,
        posHistory: undefined,
        mark: undefined,
      };
      entity.mark = false;
    }
  }

  // don't broadcast if there's nothing to update
  if (
    Object.keys(broadcastData.entityMap).length === 0 &&
    !broadcastData.collisions.length
  ) {
    return;
  }

  console.log('Broadcast game data', game.broadcastCt);

  game.broadcastCt++;
  game.players.map(playerGetById).forEach(player => {
    if (player?.socket) {
      sendIoMessage(player.socket, getShared().G_S_GAME_UPDATED, {
        game: broadcastData,
      });
    }
  });
};

const gameCreate = (lobbyId: string, playerIds: string[]): Partial<Game> => {
  const courseName = 'test';

  const course: any = courseGetByName(courseName);
  const game: Game = {
    id: randomId(),
    courseName: courseName,
    lobbyId,
    width: 0,
    height: 0,
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
    coins: [],
    collisions: [],
    round: 0,
    numRounds: course.holes.length,
    roundFinished: false,
    intervalMs: 25,
    intervalId: -1,
    broadcastMs: 75,
    broadcastId: -1,
    broadcastCt: 0,
  };

  console.debug(`Game created ${gameToString(game)}`);
  gameStorage.push(game);

  const colors = shuffle([
    'blue',
    'red',
    'green',
    'yellow',
    'purple',
    'grey',
    'orange',
  ]);
  playerIds.forEach((id, i) => {
    const player = playerGetById(id);
    if (player) {
      gameCreatePlayer(game, id, player.name, 0, 0, colors[i % colors.length]);
      player.gameId = game.id;
    }
  });

  gameLoadRound(game, 0);

  broadcastGameStatus(game, getShared().G_S_GAME_STARTED);
  gameBeginSimulationLoop(game);
  return gameGetPartial(game);
};

const gameLoadRound = (game: Game, round: number) => {
  const course = courseGetByName(game.courseName);
  if (course) {
    const hole = course.holes[round];
    game.width = hole.width;
    game.height = hole.height;
    game.planets = [];
    game.flags = [];
    game.coins = [];
    if (hole) {
      game.round = round;
      hole.planets.forEach(p => {
        gameCreatePlanet(
          game,
          p.x,
          p.y,
          p.mass ?? 25 * 10 ** 30,
          p.r,
          p.color ?? '#243F72'
        );
      });
      hole.flags.forEach(f => {
        gameCreateFlag(game, f.x, f.y);
      });
      hole.coins.forEach(c => {
        gameCreateCoin(game, c.x, c.y);
      });
      game.players
        .map(id => getShared().getEntity(game, id))
        .forEach((p: PlayerEntity, i) => {
          p.x = hole.start[0] + i * p.r * 4;
          p.y = hole.start[1];
          p.active = false;
          p.finished = false;
          p.angle = 0;
          p.posHistory = [[p.x, p.y]];
          p.posHistoryI = 0;
          p.shotCt = 0;
        });
    } else {
      throw new Error(
        `Course "${course.name}" does not have a hole for round: ${round}.`
      );
    }
  }
};

const gameBeginSimulationLoop = (game: Game) => {
  let now = +new Date();
  let prevNow = now;
  game.intervalId = setInterval(() => {
    now = +new Date();
    const nowDt = now - prevNow;
    prevNow = now;

    getShared().simulate(game, { nowDt });

    game.collisions.forEach(([entityAId, entityBId]: [string, string]) => {
      const entityA: PlayerEntity = getShared().getEntity(game, entityAId);
      const entityB: Entity | undefined = getShared().getEntity(
        game,
        entityBId
      );

      console.log('COLLISION', entityA, entityB);
      if (!entityB || entityB.type === 'planet') {
        console.log('- hit a planet or out of bounds');
        entityA.active = false;
        entityA.shotCt--;
        entityA.posHistoryI++;
        gameDropPlayerEntityAtPreviousPosition(game, entityA);
        return;
      }

      if (entityB?.type === 'coin') {
        console.log('- hit a coin.');
        entityA.shotCt--;
        if (entityA.shotCt < 0) {
          entityA.shotCt = 0;
        }
        const playerEntity = entityA as PlayerEntity;
        entityA.active = false;
        playerEntity.posHistory.push([playerEntity.x, playerEntity.y]);
        playerEntity.posHistoryI++;
        (entityB as CoinEntity).removed = true;
        entityB.mark = true;
      }

      if (entityB?.type === 'flag') {
        console.log('- hit a flag');
        entityA.active = false;
        entityA.finished = true;
      }
      entityA.mark = true;
    });
    const players = game.players.map(id => getShared().getEntity(game, id));

    const isGameCompleted = !players
      .map((playerEntity: PlayerEntity) => {
        if (playerEntity.finished || playerEntity.disconnected) {
          return true;
        }

        if (playerEntity.active && now - playerEntity.t > playerEntity.ms) {
          playerEntity.active = false;
          playerEntity.posHistory.push([playerEntity.x, playerEntity.y]);
          playerEntity.posHistoryI++;
          playerEntity.mark = true;
        }
        return false;
      })
      .includes(false);

    if (game.collisions.length) {
      broadcastGameEntityData(game);
      game.collisions = [];
    }

    if (isGameCompleted && !game.roundFinished) {
      console.debug(`${gameToString(game)} round completed!`);
      game.roundFinished = true;
      players.forEach(p => {
        game.scorecard[p.id].push(p.shotCt);
      });
      setTimeout(() => {
        game.round++;
        const course = courseGetByName(game.courseName);
        if (course && game.round >= course.holes.length) {
          console.debug('game completed');
          broadcastGameStatus(game, getShared().G_S_GAME_COMPLETED);
          gameDestroy(game);
        } else {
          console.debug('load round', game.round);
          gameLoadRound(game, game.round);
          broadcastGameStatus(game, getShared().G_S_GAME_ROUND_COMPLETED);
          setTimeout(() => {
            game.roundFinished = false;
            broadcastGameStatus(game, getShared().G_S_GAME_ROUND_STARTED);
          }, 5000);
        }
      }, 3000);
    }
  }, game.intervalMs) as any;

  game.broadcastId = setInterval(() => {
    broadcastGameEntityData(game);
  }, game.broadcastMs) as any;
};

const gameEndSimulationLoop = (game: Game) => {
  clearInterval(game.intervalId);
  clearInterval(game.broadcastId);
};

const gameDestroy = (game: Game) => {
  const ind = gameStorage.indexOf(game);
  gameEndSimulationLoop(game);
  if (ind > -1) {
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
    type: '',
    x: 0,
    y: 0,
    r: getShared().fromPx(25),
    vx: 0,
    vy: 0,
    ax: 0,
    ay: 0,
    t: 0,
    mass: 1,
    mark: true,
  };
  game.entityMap[entity.id] = entity;
  return entity;
};

const gameCreatePlanet = (
  game: Game,
  x: number,
  y: number,
  mass: number,
  r: number,
  color: string
) => {
  const planet = gameCreateEntity(game, 'planet_' + randomId()) as PlanetEntity;
  planet.type = 'planet';
  planet.mass = mass;
  planet.x = x;
  planet.y = y;
  planet.r = r;
  planet.mass = mass;
  planet.color = color;
  console.debug('- PlanetEntity created: ' + JSON.stringify(planet, null, 2));
  game.planets.push(planet.id);
};

const gameCreatePlayer = (
  game: Game,
  id: string,
  name: string,
  x: number,
  y: number,
  color: string
) => {
  const player = gameCreateEntity(game, id) as PlayerEntity;
  player.type = 'player';
  player.name = name;
  player.angle = 0;
  player.power = 1;
  player.coins = 0;
  player.color = color;
  player.finished = false;
  player.active = false;
  player.x = x;
  player.y = y;
  player.shotCt = 0;
  player.ms = 0;
  player.posHistory = [[x, y]];
  player.posHistoryI = 0;
  console.debug('- PlayerEntity created: ' + JSON.stringify(player, null, 2));
  game.players.push(id);
};

const gameCreateFlag = (game: Game, x: number, y: number) => {
  const flag = gameCreateEntity(game, 'flag_' + randomId());
  flag.type = 'flag';
  flag.x = x;
  flag.y = y;
  flag.r = getShared().fromPx(30);
  console.debug('- FlagEntity created: ' + JSON.stringify(flag, null, 2));
  game.flags.push(flag.id);
};

const gameCreateCoin = (game: Game, x: number, y: number) => {
  const coin = gameCreateEntity(game, 'coin_' + randomId()) as CoinEntity;
  coin.type = 'coin';
  coin.x = x;
  coin.y = y;
  coin.r = getShared().fromPx(30);
  coin.removed = false;
  console.debug('- CoinEntity created: ' + JSON.stringify(coin, null, 2));
  game.coins.push(coin.id);
};

const gameHasConnectedPlayers = (game: Game) => {
  const players = game.players.map(playerGetById);
  for (let i = 0; i < players.length; i++) {
    const player = players[i];
    if (player?.connected) {
      return true;
    }
  }
  return false;
};

const gameAssertPlayerEntityInGame = (
  game: Game,
  player: Player
): PlayerEntity => {
  const playerEntity = getShared().getEntity(game, player.id);
  if (!playerEntity) {
    throw new Error('PlayerEntity is not in this game.');
  }
  if (playerEntity.finished) {
    throw new Error('PlayerEntity is finished.');
  }
  return playerEntity;
};

const gameAssertPlayerCanAct = (game: Game, playerEntity: PlayerEntity) => {
  if (game.roundFinished) {
    throw new Error('Round is finished.');
  }
  if (playerEntity.finished || playerEntity.active) {
    throw new Error('Player is finished or active.');
  }
};

const gameAssertShotArgs = (game: Game, args: ShotArgs) => {
  if (args.power <= 0.5 || args.power > 2) {
    throw new Error('Invalid ShotArgs power specified.');
  }
};

const gameSetPlayerAngleDeg = (
  game: Game,
  player: Player,
  angleDeg: number
) => {
  const playerEntity = gameAssertPlayerEntityInGame(game, player);
  playerEntity.angle = angleDeg;
  playerEntity.mark = true;
};

const gameShoot = (game: Game, player: Player, args: ShotArgs) => {
  const playerEntity = gameAssertPlayerEntityInGame(game, player);
  gameAssertPlayerCanAct(game, playerEntity);
  gameAssertShotArgs(game, args);

  console.debug('- shoot', JSON.stringify(args, null, 2));

  playerEntity.active = true;
  const angleRad: number = getShared().toRadians(args.angleDeg);
  playerEntity.vx = 55000 * args.power * Math.sin(angleRad);
  playerEntity.vy = 55000 * args.power * Math.cos(angleRad);
  playerEntity.angle = args.angleDeg;
  playerEntity.shotCt++;
  playerEntity.t = +new Date();
  playerEntity.ms = args.ms;

  broadcastGameStatus(game, getShared().G_S_GAME_SET_ACTIVE_STATE);
};

const gameDropPlayerAtPreviousPosition = (game: Game, player: Player) => {
  const playerEntity = gameAssertPlayerEntityInGame(game, player);
  gameDropPlayerEntityAtPreviousPosition(game, playerEntity);
};

const gameDropPlayerEntityAtPreviousPosition = (
  game: Game,
  playerEntity: PlayerEntity
) => {
  gameAssertPlayerCanAct(game, playerEntity);
  const i = playerEntity.posHistoryI;
  const prevPos = playerEntity.posHistory[i - 1];
  console.debug(`Drop player ${playerEntity.id} at previous position ${i - 1}`);
  if (prevPos) {
    playerEntity.posHistory.splice(i, 1);
    playerEntity.posHistoryI--;
    playerEntity.x = prevPos[0];
    playerEntity.y = prevPos[1];
    playerEntity.shotCt++;
    playerEntity.mark = true;
  }
};

const gameDisconnectPlayer = (game: Game, player: Player) => {
  const playerEntity = gameAssertPlayerEntityInGame(game, player);
  playerEntity.disconnected = true;
  broadcastPlayerDisconnected(game, player.id);
};

const gameGetById = (id: string) => {
  return gameStorage.find(game => game.id === id);
};

const gameToString = (game: Game) => {
  return `Game { id=${game.id} }`;
};
