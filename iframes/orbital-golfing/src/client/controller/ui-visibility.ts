const hideEverything = () => {
  hideElement(getLoadingPane());
  hideElement(getErrorPane());
  hideElement(getMenuPane());
  hideElement(getLobbyPane());
  // hideElement(getGamePane());
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
