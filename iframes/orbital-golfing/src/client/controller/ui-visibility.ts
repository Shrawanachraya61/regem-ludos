const hideEverything = () => {
  hideElement(getLoadingPane());
  hideElement(getErrorPane());
  hideElement(getMenuPane());
  hideElement(getLobbyPane());
  hideElement(getGameUiPane());
  hideElement(getGame());
  hideElement(getGameUiTopPane());
  hideElement(getGameUiMidPane());

  getCenter().style.height = 'unset';
};

const showLoading = () => {
  hideEverything();
  showElement(getLoadingPane());
};

const showMenu = () => {
  hideEverything();
  showElement(getMenuPane());
};

const showLobby = (lobby: LobbyState) => {
  hideEverything();
  showElement(getLobbyPane());
};

const showError = () => {
  hideEverything();
  showElement(getErrorPane());
};

const showGame = () => {
  hideEverything();
  showElement(getGameUiPane());
  showElement(getGameUiTopPane());
  showElement(getGame(), true);

  getCenter().style.height = '100%';
};