import { Room } from 'model/room';
import { Player } from 'model/player';

let currentRoom: Room | null = null;
export const getCurrentRoom = (): Room => currentRoom as Room;
export const setCurrentRoom = (r: Room): void => {
  currentRoom = r;
};

let currentPlayer: Player | null = null;
export const getCurrentPlayer = (): Player => currentPlayer as Player;
export const setCurrentPlayer = (r: Player): void => {
  currentPlayer = r;
};
