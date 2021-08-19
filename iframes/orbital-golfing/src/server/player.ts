interface Player {
  id: string;
  name: string;
  socket?: Socket;
  gameId: string;
  lobbyId: string;
  connected: boolean;
}

const players: Player[] = [];

const playerCreate = (socket: Socket, name?: string): Player => {
  const existingPlayer = playerGetBySocketId(socket.id);
  if (existingPlayer) {
    throw new Error(
      'Cannot create Player. Other Player exists: ' +
        playerToString(existingPlayer)
    );
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

const playerDestroy = (player: Player) => {
  const ind = players.indexOf(player);
  if (ind > -1) {
    console.debug(`Player destroyed ${playerToString(player)}`);
    players.splice(ind, 1);
  } else {
    throw new Error(
      'Cannot destroy Player. No Player exists:' + playerToString(player)
    );
  }
};

const playerGetById = (id: string) => {
  return players.find(player => player.id === id);
};
const playerGetBySocketId = (id: string) => {
  return players.find(player => player?.socket?.id === id);
};

const playerSetName = (player: Player, name: string) => {
  if (name.length > 12) {
    throw new Error('Cannot set player name.  Length is greater than 12.');
  }
  player.name = escapeString(name);
  console.debug(`Player set name ${playerToString(player)}`);
};

const playerToString = (player: Player) => {
  return `Player: name=${player.name} (id=${player.id}) [socketId=${player?.socket?.id}]`;
};

const playerDisconnect = (player: Player) => {
  player.connected = false;
  player.socket = undefined;
};

const playerReconnect = (player: Player, socket: Socket) => {
  player.connected = true;
  player.socket = socket;
};
