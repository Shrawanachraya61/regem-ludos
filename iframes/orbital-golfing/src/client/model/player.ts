interface PlayerState {
  name: string;
  id: string;
}

const isPlayerMe = (player: PlayerState) => {
  return player.id === getPlayerId();
};

const isPlayerEntityMe = (player: PlayerEntityData) => {
  return player.id === getPlayerId();
};
