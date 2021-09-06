interface ShotArgsData {
  power: number;
  ms: number;
  angleDeg: number;
}

type Point = [number, number];

const generateShotPreview = (
  originalGameData: GameData,
  args: ShotArgsData
): Point[] => {
  const gameData = copyGameData(originalGameData);
  const playerEntity = getMyPlayerEntity(gameData);

  playerEntity.active = true;
  playerEntity.vx =
    55000 * args.power * Math.sin(getShared().toRadians(args.angleDeg));
  playerEntity.vy =
    55000 * args.power * Math.cos(getShared().toRadians(args.angleDeg));
  playerEntity.angle = args.angleDeg;

  const nowDt = 75;
  let numIterations = 12;
  if (args.power > 1) {
    numIterations = 11;
  }
  if (args.power > 1.5) {
    numIterations = 10;
  }

  const ret: Point[] = [];
  for (let i = 0; i < numIterations; i++) {
    getShared().simulate(gameData, { nowDt });
    const { x: px, y: py } = worldToPx(playerEntity.x, playerEntity.y);
    ret.push([px, py]);
    if (gameData.collisions.length) {
      break;
    }
  }
  return ret;
};

const previousGameStates: GameData[] = [];

const pushGameState = (state: GameData) => {
  const gameData = getGameData();
  if (gameData) {
    // previousGameStates.push(state);
    state.collisions.forEach(([entityAId, entityBId]) => {
      const entityA = getShared().getEntity(gameData, entityAId);
      const entityB = getShared().getEntity(gameData, entityBId);
      if (entityA) {
        if (entityB?.type === 'flag') {
          if (entityA.shotCt === 1) {
            playSound('holeInOne');
          } else {
            playSound('completed');
          }
        } else if (entityB?.type === 'coin') {
          if (entityAId === getPlayerId()) {
            playSound('coin');
          }
          createExplosionEffect(entityB.x, entityB.y);
        } else {
          playSound('expl');
          createExplosionEffect(entityA.x, entityA.y);
        }
      }
    });

    for (const i in state.entityMap) {
      gameData.entityMap[i] = state.entityMap[i];
    }

    const myEntity = getMyPlayerEntity(gameData);
    if (!myEntity.active && getUiState().entityActive) {
      console.log('reset entity active');
      setUiState({
        entityActive: false,
      });
      renderUi();
    }
  }
};

let lastAppliedState: any = null;
const applyGameState = (gameData: GameData) => {
  // const timestamp = +new Date();
  // let stateToApply: GameData | undefined = previousGameStates[0];
  // while (stateToApply && stateToApply.timestamp < timestamp) {
  //   console.log('shift');
  //   stateToApply = previousGameStates.shift();
  // }
  // if (stateToApply && stateToApply !== lastAppliedState) {
  //   lastAppliedState = stateToApply;
  //   console.log('apply game state', stateToApply);
  //   for (const i in stateToApply.entityMap) {
  //     gameData.entityMap[i] = stateToApply.entityMap[i];
  //   }
  // }
  // while (lastAppliedS
  // for (let i = previousGameStates.length - 1; i >= 0; i--) {
  //   const socketGameState = previousGameStates[i];
  //   if (socketGameState.timestamp < timestamp) {
  //     if (socketGameState.timestamp === lastAppliedTimestamp) {
  //       break;
  //     }
  //     console.log('apply gamestate', socketGameState);
  //     lastAppliedTimestamp = socketGameState.timestamp;
  //     for (const i in socketGameState.entityMap) {
  //       gameData.entityMap[i] = socketGameState.entityMap[i];
  //     }
  //     break;
  //   }
  // }
};
