/*
global
G_model_getCanvas
G_model_loadImagesAndSprites
G_model_setInputDisabled
G_model_createRoom
G_model_setCurrentRoom
G_model_getCurrentRoom
G_model_createUnit
G_model_createPlayer
G_model_setCurrentPlayer
G_controller_initEvents
G_controller_createPFPath
G_controller_renderRoom
G_controller_tickRoom
G_controller_showDeploySection
G_view_playSound
G_view_renderUi
G_view_clearScreen
UnitAllegiance
RoomPhase
UnitState
*/

const G_start = () => {
  G_model_setInputDisabled(false);
  G_view_renderUi();

  (window as any).running = true;
  const reLoop = () => (window as any).running && requestAnimationFrame(loop);
  // const reLoop = () => (window as any).running && setTimeout(() => loop(), 100);

  const loop = () => {
    const room = G_model_getCurrentRoom();
    G_view_clearScreen();
    if (room) {
      G_controller_tickRoom(room);
    }
    reLoop();
  };
  loop();
};

const G_nextRoom = (player: Player) => {
  const currentRoom = G_model_getCurrentRoom();

  if (currentRoom?.lvl === 3) {
    G_showTitle();
    return;
  }

  const room = G_model_createRoom(currentRoom ? currentRoom.lvl + 1 : 0);
  G_model_setCurrentRoom(room);
  G_model_setCurrentPlayer(player);
  player.maxDeploy++;
  G_controller_showDeploySection(room, player);
  player.units.forEach(unit => {
    if (unit.hp > 0) {
      unit.hp = unit.mhp;
    }
    unit.state = UnitState.IDLE;
    unit.disabled = false;
  });
};

const G_initNewGame = () => {
  const player = G_model_createPlayer();
  G_model_setCurrentPlayer(player);
  G_nextRoom(player);
};

const G_showTitle = () => {
  G_model_setCurrentRoom(null);
  G_view_renderUi();
};

const main = async () => {
  await Promise.all([
    G_model_loadImagesAndSprites([
      [
        'packed',
        'res/packed.png',
        16,
        16,
        2,
        2,
        ['misc1', 'terrain1', 'map1', 'actors1'],
      ],
    ]),
  ]);
  G_model_getCanvas();
  G_controller_initEvents();
  G_start();
};

window.addEventListener('load', main);
