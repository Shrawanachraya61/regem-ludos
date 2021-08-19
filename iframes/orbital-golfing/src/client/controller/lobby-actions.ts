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
