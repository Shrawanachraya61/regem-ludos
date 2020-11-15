import { Room } from 'model/room';
import { Player } from 'model/player';

let currentRoom: Room | null = ((window as any).room = null);
export const getCurrentRoom = (): Room => currentRoom as Room;
export const setCurrentRoom = (r: Room): void => {
  currentRoom = (window as any).room = r;
};

let currentPlayer: Player | null = ((window as any).player = null);
export const getCurrentPlayer = (): Player => currentPlayer as Player;
export const setCurrentPlayer = (p: Player): void => {
  currentPlayer = (window as any).player = p;
};
