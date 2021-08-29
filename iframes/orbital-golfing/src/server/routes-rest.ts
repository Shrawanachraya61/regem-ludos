const restRoutes: Record<string, any> = {};

function registerRestRequest<T = Record<string, string>>(
  route: string,
  cb: (meta: RestMeta, params: T) => any
) {
  console.debug('register REST route:', route);
  restRoutes[route] = (req: any, res: any) => {
    try {
      const socketId = req.headers.socketid;
      const player = playerGetBySocketId(socketId);
      console.debug('REST: ' + route, req.query);
      const result = cb(
        {
          req,
          res,
          player,
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
  const lobby = playerAssertInLobby(player);
  lobbyLeave(lobby, player);
  return { lobby };
});

registerRestRequest<{ angleDeg: string }>(
  getShared().G_R_GAME_SET_ANGLE,
  (meta, searchParams) => {
    const player = assertPlayer(meta);
    const game = playerAssertInGame(player);

    const angleDeg = parseInt(searchParams.angleDeg);

    if ([angleDeg].map(isNaN).includes(true)) {
      throw new Error('Cannot set angleDeg.  Malformed input args.');
    }

    gameSetPlayerAngleDeg(game, player, angleDeg);

    return {};
  }
);

registerRestRequest<{ angleDeg: string; ms: string; power: string }>(
  getShared().G_R_GAME_SHOOT,
  (meta, searchParams) => {
    const player = assertPlayer(meta);
    const game = playerAssertInGame(player);

    const ms = parseInt(searchParams.ms);
    const angleDeg = parseInt(searchParams.angleDeg);
    const power = parseInt(searchParams.power);

    if ([ms, angleDeg, power].map(isNaN).includes(true)) {
      throw new Error('Cannot shoot.  Malformed input args.');
    }

    gameShoot(game, player, {
      ms,
      angleDeg,
      power,
    });

    return {};
  }
);

Object.assign(module.exports, restRoutes);
