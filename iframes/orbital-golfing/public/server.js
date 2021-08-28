const gameStorage = [];
const broadcastGameStatus = (game, started) => {
    game.players.map(playerGetById).forEach(player => {
        if (player?.socket) {
            sendIoMessage(player.socket, started ? getShared().G_S_GAME_STARTED : getShared().G_S_GAME_COMPLETE, { game });
        }
    });
};
const broadcastGameData = (game) => {
    game.players.map(playerGetById).forEach(player => {
        if (player?.socket) {
            sendIoMessage(player.socket, getShared().G_S_GAME_DATA, { game });
        }
    });
};
const gameCreate = (lobbyId, playerIds) => {
    const game = {
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
const gameDestroy = (game) => {
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
const gameCreateEntity = (game, id) => {
    const entity = {
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
const gameCreatePlanet = (game, x, y, mass, color) => {
    const planet = gameCreateEntity(game, 'planet_' + randomId());
    planet.mass = mass;
    planet.x = x;
    planet.y = y;
    planet.mass = mass;
    planet.color = color;
    console.debug('- PlanetEntity created: ' + JSON.stringify(planet, null, 2));
    game.planets.push(planet.id);
};
const gameCreatePlayer = (game, id, x, y, color) => {
    const player = gameCreateEntity(game, id);
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
const gameHasActivePlayers = (game) => {
    const players = game.players.map(playerGetById);
    for (let i = 0; i < players.length; i++) {
        const player = players[i];
        if (player?.connected) {
            return true;
        }
    }
    return false;
};
const gameGetById = (id) => {
    return gameStorage.find(game => game.id === id);
};
const gameToString = (game) => {
    return `Game: id=${game.id}`;
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
        throw new Error('Cannot create lobby.  Name length invalid:' + name.length);
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
        throw new Error(`Cannot join lobby. ${playerToString(player)} is in another lobby: ${player.lobbyId}`);
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
    return `Lobby: ${lobby.name} (id=${lobby.id}) {playerIds=${lobby.playerIds.join(',')}}`;
};
const playerStorage = [];
const playerCreate = (socket, name) => {
    const existingPlayer = playerGetBySocketId(socket.id);
    if (existingPlayer) {
        throw new Error('Cannot create Player. Other Player exists: ' +
            playerToString(existingPlayer));
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
    if (ind > -1) {
        console.debug(`Player destroyed ${playerToString(player)}`);
        playerStorage.splice(ind, 1);
    }
    else {
        throw new Error('Cannot destroy Player. No Player exists:' + playerToString(player));
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
    return `Player: name=${player.name} (id=${player.id}) [socketId=${player?.socket?.id}]`;
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
            const lobby = lobbyGetById(player.lobbyId);
            if (lobby) {
                lobbyLeave(lobby, player);
            }
        }
        if (player.gameId) {
            const game = gameGetById(player.gameId);
            if (game && !gameHasActivePlayers(game)) {
                gameDestroy(game);
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
    restRoutes[route] = (req, res) => {
        try {
            const socketId = req.headers.socketid;
            const result = cb({
                req,
                res,
                player: playerGetBySocketId(socketId),
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
        throw new Error('Cannot start lobby.  No lobby exists for player: ' +
            playerToString(player));
    }
    const game = gameCreate(lobby.id, lobby.playerIds);
    lobbyDestroy(lobby);
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
    if (player.lobbyId) {
        const lobby = lobbyGetById(player.lobbyId);
        if (lobby) {
            lobbyLeave(lobby, player);
        }
        return { lobby };
    }
    return { lobby: undefined };
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
