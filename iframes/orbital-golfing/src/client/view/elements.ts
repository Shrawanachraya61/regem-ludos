// buttons
const getCreateGameButton = () => {
  return getElement('menu-create');
};
const getLobbyStartButton = () => {
  return getElement('lobby-start');
};
const getLobbyLeaveButton = () => {
  return getElement('lobby-leave');
};

// inputs
const getPlayerNameInput = () => {
  return getElement('menu-name');
};

// panes
const getLoadingPane = () => {
  return getElement('loading');
};
const getErrorPane = () => {
  return getElement('error');
};
const getMenuPane = () => {
  return getElement('menu');
};
const getLobbyPane = () => {
  return getElement('lobby');
};
const getLobbyListPane = () => {
  return getElement('menu-lobbies');
};
const getLobbyPlayerListPane = () => {
  return getElement('lobby-players');
};
const getLobbyName = () => {
  return getElement('lobby-name');
};
const getGameUiPane = () => {
  return getElement('game-ui');
};

//game
const getGame = () => {
  return getElement('game');
};
const getCanvas = () => {
  return getElement('canv');
};
