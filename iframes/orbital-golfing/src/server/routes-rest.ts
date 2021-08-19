// The lengths I go to make typescript work in this bizarre env
var globalShared = (console as any).shared;
const restRoutes: Record<string, any> = {};

function registerRestRequest<T = Record<string, string>>(
  route: string,
  cb: (meta: RestMeta, params: T) => any
) {
  console.debug('register REST route:', route);
  restRoutes[route] = (req: any, res: any) => {
    try {
      const socketId = req.headers.socketid;
      const result = cb(
        {
          req,
          res,
          player: playerGetBySocketId(socketId),
        },
        req.query
      );
      res.send({
        data: result,
      } as RestResponse);
    } catch (e) {
      console.error(e);
      res.send({
        error: e.message,
      } as RestResponse);
    }
  };
}

registerRestRequest<{ lobbyName: string; playerName: string }>(
  globalShared.G_R_LOBBY_CREATE,
  (meta, searchParams) => {
    const player = assertPlayer(meta);
    playerSetName(player, searchParams.playerName);
    const lobby = lobbyCreate(searchParams.lobbyName, player);
    return { lobby };
  }
);

registerRestRequest<{ lobbyId: string; playerName: string }>(
  globalShared.G_R_LOBBY_JOIN,
  (meta, searchParams) => {
    const player = assertPlayer(meta);
    const lobby = lobbyGetById(searchParams.lobbyId);
    if (!lobby) {
      throw new Error(
        'Cannot join lobby.  No lobby exists with id=' + searchParams.lobbyId
      );
    }
    playerSetName(player, searchParams.playerName);
    lobbyJoin(lobby, player);
    return { lobby };
  }
);

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
