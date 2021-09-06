var courseStorage = [{
        "name": "test",
        "holes": [
            {
                "width": 1595733330000,
                "height": 1595733330000,
                "par": 2,
                "planets": [
                    {
                        "x": 87765330000,
                        "y": -55850670000,
                        "r": 394944000000,
                        "mass": 8.850018724661703e+31
                    }
                ],
                "flags": [
                    {
                        "x": 618346670000,
                        "y": 714090670000
                    }
                ],
                "coins": [],
                "start": [
                    -801856000000,
                    -753984000000
                ]
            },
            {
                "width": 1595733330000,
                "height": 1595733330000,
                "par": 2,
                "planets": [
                    {
                        "x": -808559440000,
                        "y": 831879900000,
                        "r": 265290670000,
                        "mass": 3.8829152206245384e+31
                    },
                    {
                        "x": 61226940000,
                        "y": -181299050000,
                        "r": 550787740000,
                        "mass": 1.715166577996147e+32
                    }
                ],
                "flags": [
                    {
                        "x": -612489380000,
                        "y": -1204133990000
                    }
                ],
                "coins": [
                    {
                        "x": 925525330000,
                        "y": -985365330000
                    },
                    {
                        "x": -1272597330000,
                        "y": 1260629330000
                    }
                ],
                "start": [
                    943507980000,
                    1174162040000
                ]
            },
            {
                "width": 2234026670000,
                "height": 2234026670000,
                "par": 2,
                "planets": [
                    {
                        "x": 465096430000,
                        "y": 752348370000,
                        "r": 542010770000,
                        "mass": 1.662415500999831e+32
                    },
                    {
                        "x": 811159130000,
                        "y": -494314300000,
                        "r": 267285330000,
                        "mass": 3.9446663241074786e+31
                    },
                    {
                        "x": -1057277060000,
                        "y": 222405330000,
                        "r": 261301330000,
                        "mass": 3.7608354165744676e+31
                    },
                    {
                        "x": -1096833290000,
                        "y": -1188500190000,
                        "r": 301647460000,
                        "mass": 5.082199597864638e+31
                    }
                ],
                "flags": [
                    {
                        "x": 1124541210000,
                        "y": -1339761750000
                    }
                ],
                "coins": [
                    {
                        "x": -422519600000,
                        "y": -448245480000
                    },
                    {
                        "x": 1596335720000,
                        "y": 1642951080000
                    },
                    {
                        "x": -107495250000,
                        "y": -948466660000
                    },
                    {
                        "x": -1867610390000,
                        "y": -409898680000
                    },
                    {
                        "x": 707441780000,
                        "y": -1654243560000
                    },
                    {
                        "x": 143616000000,
                        "y": 5319110000
                    }
                ],
                "start": [
                    -1130206060000,
                    1220293180000
                ]
            },
            {
                "width": 1276586670000,
                "height": 3191466670000,
                "par": 2,
                "planets": [
                    {
                        "x": 702361760000,
                        "y": -2637268410000,
                        "r": 267285330000,
                        "mass": 3.9446663241074786e+31
                    },
                    {
                        "x": 552000580000,
                        "y": 1986339580000,
                        "r": 261301330000,
                        "mass": 3.7608354165744676e+31
                    },
                    {
                        "x": -615211970000,
                        "y": 67458290000,
                        "r": 413347880000,
                        "mass": 9.705354540538727e+31
                    }
                ],
                "flags": [
                    {
                        "x": 0,
                        "y": 2547854220000
                    }
                ],
                "coins": [
                    {
                        "x": -702743430000,
                        "y": 2854297790000
                    },
                    {
                        "x": 712760890000,
                        "y": 2882958220000
                    }
                ],
                "start": [
                    -824114020000,
                    -2731158370000
                ]
            },
            {
                "width": 2872320000000,
                "height": 2234026670000,
                "par": 2,
                "planets": [
                    {
                        "x": -2319458240000,
                        "y": 1653935710000,
                        "r": 542010770000,
                        "mass": 1.662415500999831e+32
                    },
                    {
                        "x": -1591510620000,
                        "y": 1021588480000,
                        "r": 413348790000,
                        "mass": 9.705397631948545e+31
                    },
                    {
                        "x": -925525330000,
                        "y": 478720000000,
                        "r": 413348790000,
                        "mass": 9.705397631948545e+31
                    },
                    {
                        "x": -63829330000,
                        "y": -63829330000,
                        "r": 542010770000,
                        "mass": 1.662415500999831e+32
                    }
                ],
                "flags": [
                    {
                        "x": 278802540000,
                        "y": 1708090910000
                    }
                ],
                "coins": [
                    {
                        "x": -1374640490000,
                        "y": -1780680820000
                    },
                    {
                        "x": 2306437060000,
                        "y": 1770607750000
                    },
                    {
                        "x": -878766360000,
                        "y": 1727044230000
                    },
                    {
                        "x": 2400976280000,
                        "y": -1819465120000
                    }
                ],
                "start": [
                    -2590302060000,
                    -471186140000
                ]
            }
        ]
    }];
const courseGetByName = (name) => {
    return courseStorage.find(c => c.name === name);
};
const gameStorage = [];
const gameGetPartial = (game) => {
    const partialGame = {
        ...game,
        intervalMs: undefined,
        intervalId: undefined,
        broadcastMs: undefined,
        broadcastId: undefined,
        broadcastCt: undefined,
    };
    return partialGame;
};
const broadcastGameStatus = (game, event) => {
    game.players.map(playerGetById).forEach(player => {
        if (player?.socket) {
            sendIoMessage(player.socket, event, { game: gameGetPartial(game) });
        }
    });
};
const broadcastPlayerDisconnected = (game, playerId) => {
    game.players.map(playerGetById).forEach(player => {
        if (player?.socket) {
            sendIoMessage(player.socket, getShared().G_S_GAME_PLAYER_DISCONNECTED, {
                playerId,
            });
        }
    });
};
const broadcastGameEntityData = (game) => {
    const broadcastData = {
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
                posHistory: undefined,
                mark: undefined,
            };
            entity.mark = false;
        }
    }
    if (Object.keys(broadcastData.entityMap).length === 0 &&
        !broadcastData.collisions.length) {
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
const gameCreate = (lobbyId, playerIds) => {
    const courseName = 'test';
    const course = courseGetByName(courseName);
    const game = {
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
const gameLoadRound = (game, round) => {
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
                gameCreatePlanet(game, p.x, p.y, p.mass ?? 25 * 10 ** 30, p.r, p.color ?? '#243F72');
            });
            hole.flags.forEach(f => {
                gameCreateFlag(game, f.x, f.y);
            });
            hole.coins.forEach(c => {
                gameCreateCoin(game, c.x, c.y);
            });
            game.players
                .map(id => getShared().getEntity(game, id))
                .forEach((p, i) => {
                p.x = hole.start[0] + i * p.r * 4;
                p.y = hole.start[1];
                p.active = false;
                p.finished = false;
                p.angle = 0;
                p.posHistory = [[p.x, p.y]];
                p.posHistoryI = 0;
                p.shotCt = 0;
            });
        }
        else {
            throw new Error(`Course "${course.name}" does not have a hole for round: ${round}.`);
        }
    }
};
const gameBeginSimulationLoop = (game) => {
    let now = +new Date();
    let prevNow = now;
    game.intervalId = setInterval(() => {
        now = +new Date();
        const nowDt = now - prevNow;
        prevNow = now;
        getShared().simulate(game, { nowDt });
        game.collisions.forEach(([entityAId, entityBId]) => {
            const entityA = getShared().getEntity(game, entityAId);
            const entityB = getShared().getEntity(game, entityBId);
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
                const playerEntity = entityA;
                entityA.active = false;
                playerEntity.posHistory.push([playerEntity.x, playerEntity.y]);
                playerEntity.posHistoryI++;
                entityB.removed = true;
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
            .map((playerEntity) => {
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
                }
                else {
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
    }, game.intervalMs);
    game.broadcastId = setInterval(() => {
        broadcastGameEntityData(game);
    }, game.broadcastMs);
};
const gameEndSimulationLoop = (game) => {
    clearInterval(game.intervalId);
    clearInterval(game.broadcastId);
};
const gameDestroy = (game) => {
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
const gameCreateEntity = (game, id) => {
    const entity = {
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
const gameCreatePlanet = (game, x, y, mass, r, color) => {
    const planet = gameCreateEntity(game, 'planet_' + randomId());
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
const gameCreatePlayer = (game, id, name, x, y, color) => {
    const player = gameCreateEntity(game, id);
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
const gameCreateFlag = (game, x, y) => {
    const flag = gameCreateEntity(game, 'flag_' + randomId());
    flag.type = 'flag';
    flag.x = x;
    flag.y = y;
    flag.r = getShared().fromPx(30);
    console.debug('- FlagEntity created: ' + JSON.stringify(flag, null, 2));
    game.flags.push(flag.id);
};
const gameCreateCoin = (game, x, y) => {
    const coin = gameCreateEntity(game, 'coin_' + randomId());
    coin.type = 'coin';
    coin.x = x;
    coin.y = y;
    coin.r = getShared().fromPx(30);
    coin.removed = false;
    console.debug('- CoinEntity created: ' + JSON.stringify(coin, null, 2));
    game.coins.push(coin.id);
};
const gameHasConnectedPlayers = (game) => {
    const players = game.players.map(playerGetById);
    for (let i = 0; i < players.length; i++) {
        const player = players[i];
        if (player?.connected) {
            return true;
        }
    }
    return false;
};
const gameAssertPlayerEntityInGame = (game, player) => {
    const playerEntity = getShared().getEntity(game, player.id);
    if (!playerEntity) {
        throw new Error('PlayerEntity is not in this game.');
    }
    if (playerEntity.finished) {
        throw new Error('PlayerEntity is finished.');
    }
    return playerEntity;
};
const gameAssertPlayerCanAct = (game, playerEntity) => {
    if (game.roundFinished) {
        throw new Error('Round is finished.');
    }
    if (playerEntity.finished || playerEntity.active) {
        throw new Error('Player is finished or active.');
    }
};
const gameAssertShotArgs = (game, args) => {
    if (args.power <= 0.5 || args.power > 2) {
        throw new Error('Invalid ShotArgs power specified.');
    }
};
const gameSetPlayerAngleDeg = (game, player, angleDeg) => {
    const playerEntity = gameAssertPlayerEntityInGame(game, player);
    playerEntity.angle = angleDeg;
    playerEntity.mark = true;
};
const gameShoot = (game, player, args) => {
    const playerEntity = gameAssertPlayerEntityInGame(game, player);
    gameAssertPlayerCanAct(game, playerEntity);
    gameAssertShotArgs(game, args);
    console.debug('- shoot', JSON.stringify(args, null, 2));
    playerEntity.active = true;
    const angleRad = getShared().toRadians(args.angleDeg);
    playerEntity.vx = 55000 * args.power * Math.sin(angleRad);
    playerEntity.vy = 55000 * args.power * Math.cos(angleRad);
    playerEntity.angle = args.angleDeg;
    playerEntity.shotCt++;
    playerEntity.t = +new Date();
    playerEntity.ms = args.ms;
    broadcastGameStatus(game, getShared().G_S_GAME_SET_ACTIVE_STATE);
};
const gameDropPlayerAtPreviousPosition = (game, player) => {
    const playerEntity = gameAssertPlayerEntityInGame(game, player);
    gameDropPlayerEntityAtPreviousPosition(game, playerEntity);
};
const gameDropPlayerEntityAtPreviousPosition = (game, playerEntity) => {
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
const gameDisconnectPlayer = (game, player) => {
    const playerEntity = gameAssertPlayerEntityInGame(game, player);
    playerEntity.disconnected = true;
    broadcastPlayerDisconnected(game, player.id);
};
const gameGetById = (id) => {
    return gameStorage.find(game => game.id === id);
};
const gameToString = (game) => {
    return `Game { id=${game.id} }`;
};
const sendIoMessage = function (socket, ev, payload) {
    socket.emit(ev, JSON.stringify(payload));
};
const sendIoMessageAll = function (ev, payload) {
    playerStorage.forEach(player => {
        if (player.socket) {
            sendIoMessage(player.socket, ev, payload);
        }
    });
};
const assertPlayer = (meta) => {
    if (!meta.player) {
        throw new Error('Player is not authorized.');
    }
    return meta.player;
};
function getShared() {
    return console.shared;
}
const lobbyStorage = [];
const broadcastLobbies = () => {
    sendIoMessageAll(getShared().G_S_LOBBIES_UPDATED, {
        lobbies: lobbyStorage.map(lobby => {
            return {
                ...lobby,
                playerIds: undefined,
                players: lobby.playerIds.map(playerId => {
                    const player = playerGetById(playerId);
                    return {
                        ...player,
                        socket: undefined,
                    };
                }),
            };
        }),
    });
};
const lobbyCreate = (name, creator) => {
    name = name.trim();
    if (name.length > 20 || name.length === 0) {
        throw new Error(`Cannot create lobby. Name length invalid: ${name.length}`);
    }
    name = escapeString(name);
    const lobby = {
        id: 'lobby_' + randomId(),
        playerIds: [],
        name,
    };
    console.debug(`Lobby created '${lobbyToString(lobby)}'`);
    lobbyStorage.push(lobby);
    lobbyJoin(lobby, creator);
    return lobby;
};
const lobbyDestroy = (lobby) => {
    const ind = lobbyStorage.indexOf(lobby);
    if (ind > -1) {
        lobbyStorage.splice(ind, 1);
        lobby.playerIds.forEach(playerId => {
            const player = playerGetById(playerId);
            if (player) {
                player.lobbyId = '';
            }
        });
        console.debug(`Lobby destroyed '${lobbyToString(lobby)}'`);
    }
    else {
        throw new Error(`Cannot destroy lobby '${lobby.id}'.  It does not exist.`);
    }
};
const lobbyStart = (lobby) => {
};
const lobbyGetLeader = (lobby) => {
    return playerGetById(lobby.playerIds[0]);
};
const lobbyJoin = (lobby, player) => {
    if (player.lobbyId) {
        const plStr = playerToString(player);
        throw new Error(`Cannot join lobby. ${plStr} is in another lobby.`);
    }
    lobby.playerIds.push(player.id);
    player.lobbyId = lobby.id;
    console.debug(`Lobby join '${lobbyToString(lobby)}', ${playerToString(player)}`);
    broadcastLobbies();
};
const lobbyLeave = (lobby, player) => {
    const ind = lobby.playerIds.indexOf(player.id);
    if (ind > -1) {
        lobby.playerIds.splice(ind, 1);
    }
    player.lobbyId = '';
    console.debug(`Lobby leave '${lobbyToString(lobby)}', ${playerToString(player)}`);
    if (lobby.playerIds.length === 0) {
        lobbyDestroy(lobby);
    }
    else {
        console.debug('Not destroying lobby, some players remain', lobby.playerIds);
    }
    broadcastLobbies();
};
const lobbyGetById = (id) => {
    return lobbyStorage.find(lobby => lobby.id === id);
};
const lobbyToString = (lobby) => {
    return `Lobby { ${lobby.name} (id=${lobby.id}) [playerIds=${lobby.playerIds.join(',')}]}`;
};
const playerStorage = [];
const playerCreate = (socket, name) => {
    const existingPlayer = playerGetBySocketId(socket.id);
    if (existingPlayer) {
        const plStr = playerToString(existingPlayer);
        throw new Error(`Cannot create Player. Other Player exists: ${plStr}`);
    }
    const id = randomId();
    const player = {
        id,
        name: name || '',
        socket,
        gameId: '',
        lobbyId: '',
        connected: true,
    };
    playerStorage.push(player);
    console.debug(`Player created ${playerToString(player)}`);
    return player;
};
const playerDestroy = (player) => {
    const ind = playerStorage.indexOf(player);
    const plStr = playerToString(player);
    if (ind > -1) {
        console.debug(`Player destroyed ${plStr}`);
        playerStorage.splice(ind, 1);
    }
    else {
        throw new Error(`Cannot destroy Player. No Player exists: ${plStr}`);
    }
};
const playerGetById = (id) => {
    return playerStorage.find(player => player.id === id);
};
const playerGetBySocketId = (id) => {
    return playerStorage.find(player => player?.socket?.id === id);
};
const playerSetName = (player, name) => {
    if (name.length > 12) {
        throw new Error('Cannot set player name.  Length is greater than 12.');
    }
    player.name = escapeString(name);
};
const playerToString = (player) => {
    return `Player { name=${player.name} (id=${player.id}) [socketId=${player?.socket?.id}] }`;
};
const playerAssertInLobby = (player) => {
    const lobby = lobbyGetById(player.lobbyId);
    if (!lobby) {
        throw new Error('Player not in active lobby.');
    }
    return lobby;
};
const playerAssertInGame = (player) => {
    const game = gameGetById(player.gameId);
    if (!game) {
        throw new Error('Player not in active game.');
    }
    return game;
};
const playerDisconnect = (player) => {
    player.connected = false;
    player.socket = undefined;
};
const playerReconnect = (player, socket) => {
    player.connected = true;
    player.socket = socket;
};
const ioRoutes = {};
const registerIoRequest = (route, cb) => {
    console.debug('register IO route:', route);
    ioRoutes[route] = (socket, payload) => {
        try {
            cb({
                socketId: socket.id,
                player: playerGetBySocketId(socket.id),
            }, payload);
        }
        catch (e) {
            console.error(e);
        }
    };
};
registerIoRequest('disconnect', meta => {
    const player = meta.player;
    if (player) {
        console.debug('Disconnected: ' + playerToString(player));
        playerDestroy(player);
        if (player.lobbyId) {
            console.log(' - Player will be removed from lobby.');
            const lobby = lobbyGetById(player.lobbyId);
            if (lobby) {
                lobbyLeave(lobby, player);
            }
        }
        if (player.gameId) {
            const game = gameGetById(player.gameId);
            console.log(' - Player will be removed from game.');
            if (game) {
                gameDisconnectPlayer(game, player);
                if (!gameHasConnectedPlayers(game)) {
                    console.log('game should be destroyed');
                    gameDestroy(game);
                }
            }
        }
    }
});
Object.assign(module.exports, {
    io: (socket) => {
        for (const i in ioRoutes) {
            socket.on(i, ev => ioRoutes[i](socket, ev));
        }
        const player = playerCreate(socket, randomId());
        sendIoMessage(socket, getShared().G_S_CONNECTED, {
            id: player.id,
            socketId: socket.id,
        });
        broadcastLobbies();
        console.debug('Connected: ' + playerToString(player));
    },
});
const restRoutes = {};
function registerRestRequest(route, cb) {
    console.debug('register REST route:', route);
    restRoutes[route] = async (req, res) => {
        try {
            const socketId = req.headers.socketid;
            const player = playerGetBySocketId(socketId);
            console.debug('REST: ' + route, req.query);
            const result = await cb({
                req,
                res,
                player,
            }, req.query);
            res.send({
                data: result,
            });
        }
        catch (e) {
            console.error(e);
            res.send({
                error: e.message,
            });
        }
    };
}
registerRestRequest(getShared().G_R_LOBBY_CREATE, (meta, searchParams) => {
    const player = assertPlayer(meta);
    playerSetName(player, searchParams.playerName);
    const lobby = lobbyCreate(searchParams.lobbyName, player);
    return { lobby };
});
registerRestRequest(getShared().G_R_LOBBY_START, meta => {
    const player = assertPlayer(meta);
    let lobby = null;
    if (player.lobbyId) {
        lobby = lobbyGetById(player.lobbyId);
    }
    if (!lobby) {
        const plStr = playerToString(player);
        throw new Error(`Cannot start lobby. No lobby exists for player: ${plStr} `);
    }
    const game = gameCreate(lobby.id, lobby.playerIds);
    lobbyDestroy(lobby);
    broadcastLobbies();
    return {
        game,
    };
});
registerRestRequest(getShared().G_R_LOBBY_JOIN, (meta, searchParams) => {
    const player = assertPlayer(meta);
    const lobby = lobbyGetById(searchParams.lobbyId);
    if (!lobby) {
        throw new Error('Cannot join lobby.  No lobby exists with id=' + searchParams.lobbyId);
    }
    playerSetName(player, searchParams.playerName);
    lobbyJoin(lobby, player);
    return { lobby };
});
registerRestRequest(getShared().G_R_LOBBY_LEAVE, meta => {
    const player = assertPlayer(meta);
    const lobby = playerAssertInLobby(player);
    lobbyLeave(lobby, player);
    return { lobby };
});
registerRestRequest(getShared().G_R_GAME_SET_ANGLE, (meta, searchParams) => {
    const player = assertPlayer(meta);
    const game = playerAssertInGame(player);
    const angleDeg = parseInt(searchParams.angleDeg);
    if ([angleDeg].map(isNaN).includes(true)) {
        throw new Error('Cannot set angleDeg.  Malformed input args.');
    }
    gameSetPlayerAngleDeg(game, player, angleDeg);
    return {};
});
registerRestRequest(getShared().G_R_GAME_SHOOT, (meta, searchParams) => {
    const player = assertPlayer(meta);
    const game = playerAssertInGame(player);
    const ms = parseInt(searchParams.ms);
    const angleDeg = parseFloat(searchParams.angleDeg);
    const power = parseFloat(searchParams.power);
    if ([ms, angleDeg, power].map(isNaN).includes(true)) {
        throw new Error('Cannot shoot.  Malformed input args.');
    }
    gameShoot(game, player, {
        ms,
        angleDeg,
        power,
    });
    return {};
});
registerRestRequest(getShared().G_R_GAME_PREV, async (meta) => {
    const player = assertPlayer(meta);
    const game = playerAssertInGame(player);
    gameDropPlayerAtPreviousPosition(game, player);
    await new Promise(resolve => setTimeout(resolve, 100));
    return {};
});
Object.assign(module.exports, restRoutes);
const randomId = () => {
    return Math.random().toString(36).substr(2, 9);
};
const escapeString = (s) => {
    const lookup = {
        '&': '&amp;',
        '"': '&quot;',
        '<': '&lt;',
        '>': '&gt;',
    };
    return s.replace(/[&"<>]/g, c => lookup[c]);
};
const shuffle = (arr) => {
    const ret = [];
    const cp = [...arr];
    while (cp.length) {
        const i = Math.floor(Math.random() * cp.length);
        ret.push(cp[i]);
        cp.splice(i, 1);
    }
    return ret;
};
