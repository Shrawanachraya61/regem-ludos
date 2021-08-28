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
  getShared().G_R_LOBBY_CREATE,
  (meta, searchParams) => {
    const player = assertPlayer(meta);
    playerSetName(player, searchParams.playerName);
    const lobby = lobbyCreate(searchParams.lobbyName, player);
    return { lobby };
  }
);

registerRestRequest<{ lobbyName: string; playerName: string }>(
  getShared().G_R_LOBBY_START,
  meta => {
    const player = assertPlayer(meta);
    let lobby: any = null;
    if (player.lobbyId) {
      lobby = lobbyGetById(player.lobbyId);
    }
    if (!lobby) {
      throw new Error(
        'Cannot start lobby.  No lobby exists for player: ' +
          playerToString(player)
      );
    }
    const game = gameCreate(lobby.id, lobby.playerIds);
    lobbyDestroy(lobby);
    return {
      game,
    };
  }
);

registerRestRequest<{ lobbyId: string; playerName: string }>(
  getShared().G_R_LOBBY_JOIN,
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
