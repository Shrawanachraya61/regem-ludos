class Shared {
  // Gravitational constant
  G_G = 6.67428e-11;
  // Assumed scale: 100 pixels = 1AU.
  G_AU = 149.6e6 * 1000; //  149.6 million km; in meters
  G_SCALE = (75 / 149.6e6) * 1000;
  G_FRAME_MS = 13.333;
  G_MASS_MIN = 5.0 * 10 ** 30;
  G_MASS_MAX = 100.0 * 10 ** 30;
  G_R_LOBBY_CREATE = 'lobby-create';
  G_R_LOBBY_JOIN = 'lobby-join';
  G_R_LOBBY_LEAVE = 'lobby-leave';
  G_R_LOBBY_NAME = 'lobby-name';
  G_S_CONNECTED = 'game-connected';
  G_S_LOBBY_UPDATED = 'lobby-updated';
  G_S_LOBBIES_UPDATED = 'lobbies-updated';
  test() {
    console.log('shared');
  }
}
console.shared = new Shared();
