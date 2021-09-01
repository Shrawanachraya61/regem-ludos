interface Lobby {
  id: string;
  name: string;
  playerIds: string[];
}

const lobbyStorage: Lobby[] = [];

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

const lobbyCreate = (name: string, creator: Player): Lobby => {
  name = name.trim();
  if (name.length > 20 || name.length === 0) {
    throw new Error(`Cannot create lobby. Name length invalid: ${name.length}`);
  }
  name = escapeString(name);
  const lobby: Lobby = {
    id: 'lobby_' + randomId(),
    playerIds: [],
    name,
  };
  console.debug(`Lobby created '${lobbyToString(lobby)}'`);
  lobbyStorage.push(lobby);
  lobbyJoin(lobby, creator);
  return lobby;
};

const lobbyDestroy = (lobby: Lobby) => {
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
    const plStr = playerToString(player);
    throw new Error(`Cannot join lobby. ${plStr} is in another lobby.`);
  }
  lobby.playerIds.push(player.id);
  player.lobbyId = lobby.id;
  console.debug(
    `Lobby join '${lobbyToString(lobby)}', ${playerToString(player)}`
  );

  broadcastLobbies();
};

const lobbyLeave = (lobby: Lobby, player: Player) => {
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
  return lobbyStorage.find(lobby => lobby.id === id);
};

const lobbyToString = (lobby: Lobby) => {
  return `Lobby { ${lobby.name} (id=${
    lobby.id
  }) [playerIds=${lobby.playerIds.join(',')}]}`;
};
