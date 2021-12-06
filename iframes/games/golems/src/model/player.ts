interface Player {
  maxDeploy: number;
  units: Unit[];
}

const G_model_createPlayer = (): Player => {
  return {
    maxDeploy: 4,
    units: [],
  };
};
