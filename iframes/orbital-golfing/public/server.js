const sendIoMessage = function (socket, ev, payload) {
    socket.emit(ev, JSON.stringify(payload));
};
const sendIoMessageAll = function (ev, payload) {
    players.forEach(player => {
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
const lobbies = [];
const broadcastLobbies = () => {
    sendIoMessageAll(globalShared.G_S_LOBBIES_UPDATED, {
        lobbies: lobbies.map(lobby => {
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
    lobbies.push(lobby);
    lobbyJoin(lobby, creator);
    return lobby;
};
const lobbyDestroy = (lobby) => {
    const ind = lobbies.indexOf(lobby);
    if (ind > -1) {
        lobbies.splice(ind, 1);
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
    console.debug(`Lobby, looking to leave '${lobbyToString(lobby)}', ${playerToString(player)}`);
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
    return lobbies.find(lobby => lobby.id === id);
};
const lobbyToString = (lobby) => {
    return `Lobby: ${lobby.name} (id=${lobby.id}) {playerIds=${lobby.playerIds.join(',')}}`;
};
const players = [];
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
    players.push(player);
    console.debug(`Player created ${playerToString(player)}`);
    return player;
};
const playerDestroy = (player) => {
    const ind = players.indexOf(player);
    if (ind > -1) {
        console.debug(`Player destroyed ${playerToString(player)}`);
        players.splice(ind, 1);
    }
    else {
        throw new Error('Cannot destroy Player. No Player exists:' + playerToString(player));
    }
};
const playerGetById = (id) => {
    return players.find(player => player.id === id);
};
const playerGetBySocketId = (id) => {
    return players.find(player => player?.socket?.id === id);
};
const playerSetName = (player, name) => {
    if (name.length > 12) {
        throw new Error('Cannot set player name.  Length is greater than 12.');
    }
    player.name = escapeString(name);
    console.debug(`Player set name ${playerToString(player)}`);
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
var globalShared = console.shared;
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
        if (player.lobbyId) {
            const lobby = lobbyGetById(player.lobbyId);
            if (lobby) {
                lobbyLeave(lobby, player);
            }
        }
        playerDestroy(player);
    }
});
Object.assign(module.exports, {
    io: (socket) => {
        for (const i in ioRoutes) {
            socket.on(i, ev => ioRoutes[i](socket, ev));
        }
        const player = playerCreate(socket, randomId());
        sendIoMessage(socket, globalShared.G_S_CONNECTED, {
            id: player.id,
            socketId: socket.id,
        });
        broadcastLobbies();
        console.debug('Connected: ' + playerToString(player));
    },
});
var globalShared = console.shared;
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
registerRestRequest(globalShared.G_R_LOBBY_CREATE, (meta, searchParams) => {
    const player = assertPlayer(meta);
    playerSetName(player, searchParams.playerName);
    const lobby = lobbyCreate(searchParams.lobbyName, player);
    return { lobby };
});
registerRestRequest(globalShared.G_R_LOBBY_JOIN, (meta, searchParams) => {
    const player = assertPlayer(meta);
    const lobby = lobbyGetById(searchParams.lobbyId);
    if (!lobby) {
        throw new Error('Cannot join lobby.  No lobby exists with id=' + searchParams.lobbyId);
    }
    playerSetName(player, searchParams.playerName);
    lobbyJoin(lobby, player);
    return { lobby };
});
registerRestRequest(globalShared.G_R_LOBBY_LEAVE, meta => {
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
