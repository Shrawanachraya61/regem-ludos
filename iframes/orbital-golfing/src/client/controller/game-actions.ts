const POWER_MULTIPLIERS = [0.75, 1, 1.25, 1.5, 1.75, 2];

const getCurrentShotArgs = (): ShotArgsData => {
  return {
    angleDeg: getLocalPlayerAngle(),
    power: getLocalPlayerPower(),
    ms: 4000,
  };
};

const sendRequestToShoot = async () => {
  setUiState({
    entityActive: true,
  });
  const resp = await sendRestRequest<{}>(
    getShared().G_R_GAME_SHOOT,
    getCurrentShotArgs() as any
  );
  if (resp.error) {
    setUiState({
      entityActive: false,
    });
  }

  renderUi();
};

const sendRequestToSetAngle = async () => {
  await sendRestRequest<{}>(getShared().G_R_GAME_SET_ANGLE, {
    angleDeg: getCurrentShotArgs().angleDeg,
  });
};

const sendRequestToGoToPrev = async () => {
  await sendRestRequest<{}>(getShared().G_R_GAME_PREV);
  renderUi();
};

const centerOnPlayer = () => {
  const gameData = getGameData();
  if (gameData) {
    const myEntity = getMyPlayerEntity(gameData);
    const { x: px, y: py } = worldToPx(myEntity.x, myEntity.y);
    const canvas: any = getCanvas();
    const width = canvas.width;
    const height = canvas.height;
    setPanZoomPosition(px - width / 2, -(py - height / 2), 0.5);
  }
};
