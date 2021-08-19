const changePlayerName = async (name: string) => {
  if (name.length <= 12) {
    setUiState({
      ...uiState,
      name: name,
    });
  }
};
