import { OverworldTemplate, OverworldCharacter } from 'model/overworld';

const exp = {} as { [key: string]: OverworldTemplate };
export const get = (key: string): OverworldTemplate => {
  const result = exp[key];
  if (!result) {
    throw new Error(`No overworld exists with name: ${key}`);
  }
  return {
    ...result,
  };
};

export const init = () => {
  exp.TEST = {
    roomName: 'test',
    characters: []
  };
  exp.TEST2 = {
    roomName: 'test2',
    characters: []
  };
};
