const LobbyListItem = (lobby: LobbyState): HTMLElement => {
  const div = document.createElement('div');
  div.className = 'pane flex-hz pane-secondary';
  const button = document.createElement('button');
  button.style.width = '80%';
  button.className = 'secondary';
  button.innerText = `${lobby.name} (${lobby.players.length})`;
  button.onclick = () => {
    joinLobby(lobby.id, uiState.name);
  };
  div.appendChild(button);
  return div;
};
const renderLobbyList = (lobbies: LobbyState[]) => {
  const lobbyList = getLobbyListPane();
  setHTML(lobbyList, '');
  lobbies.forEach(lobby => {
    lobbyList.appendChild(LobbyListItem(lobby));
  });
};

const renderMenu = () => {
  const uiState = getUiState();
  renderLobbyList(uiState.lobbies);

  const playerName: any = getPlayerNameInput();
  playerName.value = uiState.name;
  playerName.onblur = (ev: any) => {
    setUiState({
      name: ev.target.value,
    });
  };

  const createGameButton: any = getCreateGameButton();
  createGameButton.onclick = () => {
    createLobby(getUiState().name + "'s Game", getUiState().name);
  };
};

const LobbyPlayer = (player: PlayerState, i: number) => {
  return `<div class="pane pane-secondary">${i + 1}. <span class="${
    isPlayerMe(player) ? 'underlined' : ''
  }">${player.name}</span></div>`;
};
const renderLobby = (lobby: LobbyState) => {
  const lobbyName = getLobbyName();
  lobbyName.innerHTML = lobby.name;
  const html = lobby.players.reduce((html, player, i) => {
    return html + LobbyPlayer(player, i);
  }, '');
  const lobbyPlayersPane = getLobbyPlayerListPane();
  setHTML(lobbyPlayersPane, html);

  const startGameButton: any = getLobbyStartButton();
  startGameButton.disabled = !isPlayerMe(lobby.players[0]);
  startGameButton.onclick = () => {
    startLobby();
  };
  const leaveGameButton = getLobbyLeaveButton();
  leaveGameButton.onclick = () => {
    leaveLobby();
  };
};

const renderGameUi = () => {
  const gameData = getGameData();
  if (!gameData) {
    return;
  }

  console.log('RENDER GAME UI', gameData);
};

const renderUi = () => {
  const uiState = getUiState();
  console.log('RENDER UI', uiState);
  switch (uiState.activePane) {
    case 'loading': {
      showLoading();
      break;
    }
    case 'menu': {
      showMenu();
      renderMenu();
      break;
    }
    case 'lobby': {
      const lobby = uiState.lobbies.find(lobby => lobby.id === uiState.lobbyId);
      if (lobby) {
        showLobby(lobby);
        renderLobby(lobby);
      }
      break;
    }
    case 'game': {
      showGame();
      renderGameUi();
    }
  }
};
