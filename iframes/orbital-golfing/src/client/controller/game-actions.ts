const getCurrentShotArgs = (): ShotArgsData => {
  return {
    angleDeg: getLocalPlayerAngle(),
    power: 1,
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

const centerOnPlayer = () => {
  const gameData = getGameData();
  if (gameData) {
    const myEntity = getMyPlayerEntity(gameData);
    const { x: px, y: py } = worldToPx(myEntity.x, myEntity.y);
    const canvas: any = getCanvas();
    const width = canvas.width;
    const height = canvas.height;
    setPanZoomPosition(px - width / 2, -(py - height / 2), 1);
  }
};
