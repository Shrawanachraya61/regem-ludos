var globalShared = (console as any).shared;
const ioRoutes: Record<string, any> = {};

const registerIoRequest = (
  route: string,
  cb: (meta: SocketMeta, params: Record<string, string>) => void
) => {
  console.debug('register IO route:', route);
  ioRoutes[route] = (socket: Socket, payload: any) => {
    try {
      cb(
        {
          socketId: socket.id,
          player: playerGetBySocketId(socket.id),
        },
        payload
      );
    } catch (e) {
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
  io: (socket: Socket) => {
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
