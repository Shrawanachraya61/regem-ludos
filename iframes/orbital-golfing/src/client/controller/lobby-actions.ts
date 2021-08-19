const createLobby = async (lobbyName: string, playerName: string) => {
  showLoading();
  const resp = await sendRestRequest<{ lobby: LobbyState }>(
    getShared().G_R_LOBBY_CREATE,
    {
      lobbyName,
      playerName,
    }
  );
  const lobby = resp.data?.lobby;
  if (lobby) {
    setUiState({
      activePane: 'lobby',
      lobbyId: lobby.id,
    });
  }
  renderUi();
};

const startLobby = async () => {
  showLoading();
  await sendRestRequest<{ lobby: LobbyState }>(getShared().G_R_LOBBY_START);

  // const lobby = resp.data?.lobby;
  // if (lobby) {
  //   setUiState({
  //     activePane: 'game',
  //     lobbyId: '',
  //   });
  // }
  // renderUi();
};

const joinLobby = async (lobbyId: string, playerName: string) => {
  showLoading();
  const resp = await sendRestRequest<{ lobby: LobbyState }>(
    getShared().G_R_LOBBY_JOIN,
    {
      lobbyId,
      playerName,
    }
  );
  const lobby = resp.data?.lobby;
  if (lobby) {
    setUiState({
      activePane: 'lobby',
      lobbyId: lobby.id,
    });
  }
  renderUi();
};

const leaveLobby = async () => {
  showLoading();
  const resp = await sendRestRequest<{ lobby: LobbyState }>(
    getShared().G_R_LOBBY_LEAVE
  );
  if (!resp.error) {
    setUiState({
      activePane: 'menu',
      lobbyId: '',
    });
  }
  renderUi();
};
