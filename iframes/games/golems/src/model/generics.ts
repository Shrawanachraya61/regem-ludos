/*
global
Room
*/

const G_model_getScale = (): number => 4;

let model_inputDisabled = false;
const G_model_isInputDisabled = (): boolean => model_inputDisabled;
const G_model_setInputDisabled = (v: boolean) => (model_inputDisabled = v);

let model_soundEnabled = false;
const G_model_setSoundEnabled = (v: boolean) => (model_soundEnabled = v);
const G_model_isSoundEnabled = () => model_soundEnabled;

let model_currentRoom: Room | null = null;
const G_model_setCurrentRoom = (room: Room | null) =>
  (model_currentRoom = room);
const G_model_getCurrentRoom = () => model_currentRoom;

let model_currentPlayer: Player | null = null;
const G_model_setCurrentPlayer = (player: Player) =>
  (model_currentPlayer = player);
const G_model_getCurrentPlayer = () => model_currentPlayer;
