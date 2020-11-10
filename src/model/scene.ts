import { Room } from 'model/room';

let currentRoom: Room | null = null;
export const getCurrentRoom = (): Room => currentRoom as Room;
export const setCurrentRoom = (r: Room): void => {
  currentRoom = r;
};
