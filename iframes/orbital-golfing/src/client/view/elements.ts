// labels
const getAngleLabel = () => {
  return getElement('game-angle-label');
};

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
const getShootButton = () => {
  return getElement('game-shoot');
};

// inputs
const getPlayerNameInput = () => {
  return getElement('menu-name');
};
const getAngleInput = () => {
  return getElement('game-angle');
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
const getGameUiTopPane = () => {
  return getElement('game-ui-top');
};
const getGameUiMidPane = () => {
  return getElement('game-ui-mid');
};

//game
const getGame = () => {
  return getElement('game');
};
const getCanvas = () => {
  return getElement('canv');
};
const getCtx = (): CanvasRenderingContext2D => {
  return (getCanvas() as any).getContext('2d');
};
const getCenter = () => {
  return getElement('center');
};
