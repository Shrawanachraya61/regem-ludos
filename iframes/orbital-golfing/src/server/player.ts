interface Player {
  id: string;
  name: string;
  socket?: Socket;
  gameId: string;
  lobbyId: string;
  connected: boolean;
}

const playerStorage: Player[] = [];

const playerCreate = (socket: Socket, name?: string): Player => {
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

const playerDestroy = (player: Player) => {
  const ind = playerStorage.indexOf(player);
  const plStr = playerToString(player);
  if (ind > -1) {
    console.debug(`Player destroyed ${plStr}`);
    playerStorage.splice(ind, 1);
  } else {
    throw new Error(`Cannot destroy Player. No Player exists: ${plStr}`);
  }
};

const playerGetById = (id: string) => {
  return playerStorage.find(player => player.id === id);
};
const playerGetBySocketId = (id: string) => {
  return playerStorage.find(player => player?.socket?.id === id);
};

const playerSetName = (player: Player, name: string) => {
  if (name.length > 12) {
    throw new Error('Cannot set player name.  Length is greater than 12.');
  }
  player.name = escapeString(name);
};

const playerToString = (player: Player) => {
  return `Player { name=${player.name} (id=${player.id}) [socketId=${player?.socket?.id}] }`;
};

const playerAssertInLobby = (player: Player) => {
  const lobby = lobbyGetById(player.lobbyId);
  if (!lobby) {
    throw new Error('Player not in active lobby.');
  }
  return lobby;
};

const playerAssertInGame = (player: Player) => {
  const game = gameGetById(player.gameId);
  if (!game) {
    throw new Error('Player not in active game.');
  }
  return game;
};

const playerDisconnect = (player: Player) => {
  player.connected = false;
  player.socket = undefined;
};

const playerReconnect = (player: Player, socket: Socket) => {
  player.connected = true;
  player.socket = socket;
};
