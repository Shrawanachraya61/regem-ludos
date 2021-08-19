interface Lobby {
  id: string;
  name: string;
  playerIds: string[];
}

const lobbies: Lobby[] = [];

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

const lobbyCreate = (name: string, creator: Player): Lobby => {
  name = name.trim();
  if (name.length > 20 || name.length === 0) {
    throw new Error('Cannot create lobby.  Name length invalid:' + name.length);
  }
  name = escapeString(name);
  const lobby: Lobby = {
    id: 'lobby_' + randomId(),
    playerIds: [],
    name,
  };
  console.debug(`Lobby created '${lobbyToString(lobby)}'`);
  lobbies.push(lobby);
  lobbyJoin(lobby, creator);
  return lobby;
};

const lobbyDestroy = (lobby: Lobby) => {
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
  } else {
    throw new Error(`Cannot destroy lobby '${lobby.id}'.  It does not exist.`);
  }
};

const lobbyStart = (lobby: Lobby) => {
  // create game
  // destroy lobby
};

const lobbyGetLeader = (lobby: Lobby): Player | undefined => {
  return playerGetById(lobby.playerIds[0]);
};

const lobbyJoin = (lobby: Lobby, player: Player) => {
  if (player.lobbyId) {
    throw new Error(
      `Cannot join lobby. ${playerToString(player)} is in another lobby: ${
        player.lobbyId
      }`
    );
  }
  lobby.playerIds.push(player.id);
  player.lobbyId = lobby.id;
  console.debug(
    `Lobby join '${lobbyToString(lobby)}', ${playerToString(player)}`
  );

  broadcastLobbies();
};

const lobbyLeave = (lobby: Lobby, player: Player) => {
  console.debug(
    `Lobby, looking to leave '${lobbyToString(lobby)}', ${playerToString(
      player
    )}`
  );
  const ind = lobby.playerIds.indexOf(player.id);
  if (ind > -1) {
    lobby.playerIds.splice(ind, 1);
  }
  player.lobbyId = '';
  console.debug(
    `Lobby leave '${lobbyToString(lobby)}', ${playerToString(player)}`
  );
  if (lobby.playerIds.length === 0) {
    lobbyDestroy(lobby);
  } else {
    console.debug('Not destroying lobby, some players remain', lobby.playerIds);
  }

  broadcastLobbies();
};

const lobbyGetById = (id: string) => {
  return lobbies.find(lobby => lobby.id === id);
};

const lobbyToString = (lobby: Lobby) => {
  return `Lobby: ${lobby.name} (id=${
    lobby.id
  }) {playerIds=${lobby.playerIds.join(',')}}`;
};
