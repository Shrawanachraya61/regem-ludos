const LobbyListItem = (lobby: LobbyState): HTMLElement => {
  const div = document.createElement('div');
  div.className = 'pane flex-hz pane-secondary';
  const button = document.createElement('button');
  button.style.width = '80%';
  button.className = 'secondary';
  button.innerText = `${lobby.name} (${lobby.players.length})`;
  button.onclick = () => {
    playSound('click');
    joinLobby(lobby.id, uiState.name);
  };
  div.appendChild(button);
  return div;
};
const renderLobbyList = (lobbies: LobbyState[]) => {
  const lobbyList = getLobbyListPane();
  setHTML(lobbyList, '');
  if (lobbies.length) {
    lobbies.forEach(lobby => {
      lobbyList.appendChild(LobbyListItem(lobby));
    });
  } else {
    setHTML(
      lobbyList,
      '<div style="text-align: center">There are no lobbies right now.</div>'
    );
  }
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
    playSound('click');
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
    playSound('click');
    startLobby();
  };
  const leaveGameButton = getLobbyLeaveButton();
  leaveGameButton.onclick = () => {
    playSound('click');
    leaveLobby();
  };
};

const renderGameUi = () => {
  const gameData = getGameData();
  if (!gameData) {
    return;
  }

  const myEntity = getMyPlayerEntity(gameData);

  if (uiState.entityActive || myEntity.finished) {
    getGameUiPane().style.display = 'none';
  } else {
    getGameUiPane().style.display = 'block';
  }

  const shootButton: any = getShootButton();
  shootButton.onclick = () => {
    playSound('click');
    sendRequestToShoot();
    renderUi();
  };

  const prevButton: any = getPrevButton();
  prevButton.onclick = () => {
    playSound('click');
    sendRequestToGoToPrev();
    renderUi();
  };
  prevButton.disabled = (myEntity as any).posHistoryI === 0;

  const angleInput: any = getAngleInput();
  angleInput.oninput = ev => {
    const value = Number(ev.target.value);
    setLocalPlayerAngle(value);
    getAngleLabel().innerHTML = 'Angle ' + value;
    setShotPreview(generateShotPreview(gameData, getCurrentShotArgs()));
  };
  angleInput.onchange = () => {
    sendRequestToSetAngle();
  };

  const powerInput: any = getPowerInput();
  powerInput.max = POWER_MULTIPLIERS.length - 1;
  powerInput.oninput = ev => {
    const value = Number(ev.target.value);
    setLocalPlayerPowerIndex(value);
    setShotPreview(generateShotPreview(gameData, getCurrentShotArgs()));
  };

  setShotPreview(generateShotPreview(gameData, getCurrentShotArgs()));

  const gameUiTop = getGameUiTopPane();
  setHTML(gameUiTop, '');

  const colorInfoLabel = createElement('div');
  setHTML(
    colorInfoLabel,
    `You are the <span style="${getColorStyles(
      myEntity.color
    )}">${myEntity.color.toUpperCase()}</span> Player.`
  );
  colorInfoLabel.className = 'game-line';
  gameUiTop.appendChild(colorInfoLabel);

  const shotInfoLabel = createElement('div');
  setHTML(
    shotInfoLabel,
    myEntity.finished
      ? 'Finished!'
      : `You are on shot number ${myEntity.shotCt + 1}.`
  );
  gameUiTop.appendChild(shotInfoLabel);

  const centerLink = createElement('div');
  setHTML(centerLink, 'Center on player.');
  centerLink.className = 'link game-line';
  centerLink.onclick = () => {
    centerOnPlayer();
  };
  gameUiTop.appendChild(centerLink);

  const gameUiMid = getGameUiMidPane();
  setHTML(gameUiMid, '');
  if (myEntity.finished) {
    showElement(gameUiMid, true);
  } else {
    hideElement(gameUiMid);
  }

  if (uiState.roundCompleted) {
    renderScoreCard(gameUiMid);

    const div = createElement('div');
    setHTML(div, 'Next round starting soon...');
    gameUiMid.appendChild(div);
  } else {
    const shotResultLabel = createElement('div');
    setHTML(shotResultLabel, `You shot a ${myEntity.shotCt}.`);
    shotResultLabel.style['font-size'] = '42px';
    gameUiMid.appendChild(shotResultLabel);
  }
};

const renderScoreCard = (parent: HTMLElement) => {
  const gameData = getGameData();
  if (!gameData) {
    return;
  }

  const table = createElement('table');
  const head = createElement('thead');
  const row = createElement('tr');
  for (let i = 0; i < gameData.numRounds + 2; i++) {
    const column = createElement('th');
    setHTML(
      column,
      i === gameData.numRounds + 1 ? 'Total' : i === 0 ? 'Name' : 'Rd ' + i
    );
    row.appendChild(column);
  }
  head.appendChild(row);
  table.appendChild(head);

  gameData.players
    .map(playerId => getShared().getEntity(gameData, playerId))
    .forEach((playerEntity: PlayerEntityData) => {
      if (playerEntity.disconnected) {
        return;
      }

      const row = createElement('tr');
      const scores = gameData.scorecard[playerEntity.id];
      const label = createElement('td');
      setHTML(
        label,
        `<div style="${getColorStyles(playerEntity.color)}">${
          playerEntity.name
        }</div>`
      );
      row.appendChild(label);
      let total = 0;
      for (let i = 0; i < gameData.numRounds; i++) {
        const column = createElement('td');
        total += scores[i] ?? 0;
        setHTML(column, String(scores[i] ?? '_'));
        row.appendChild(column);
      }
      const totalColumn = createElement('td');
      setHTML(totalColumn, String(total));
      row.appendChild(totalColumn);
      table.appendChild(row);
    });
  parent.appendChild(table);
};

const renderSummary = () => {
  const summaryScore = getSummaryScorePane();
  setHTML(summaryScore, '');
  renderScoreCard(summaryScore);

  const continueButton = getSummaryContinueButton();
  continueButton.onclick = () => {
    playSound('click');
    setUiState({
      activePane: 'menu',
    });
  };
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
    case 'summary': {
      showSummary();
      renderSummary();
      break;
    }
    case 'game': {
      showGame();
      renderGameUi();
      panZoom();
    }
  }
};
