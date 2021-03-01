interface TileTemplate {
  baseSprite: string;
  animName?: string;
  isWall?: boolean;
}

const exp = {} as Record<string, TileTemplate>;
const replacementTemplates = {} as Record<string, string>;

export const get = (key: string): TileTemplate => {
  const result = exp[key];
  if (!result) {
    throw new Error(`No tile template exists with name: ${key}`);
  }
  return {
    ...result,
  };
};

export const getIfExists = (key: string): TileTemplate | null => {
  const result = exp[key];
  if (!result) {
    return null;
  }
  return {
    ...result,
  };
};

export const getReplacementTemplate = (key: string): TileTemplate | null => {
  const result = replacementTemplates[key];
  if (!result) {
    return null;
  }
  const tileTemplate = get(result);
  return {
    ...tileTemplate,
  };
};

export const init = () => {
  exp.RED_DOOR_BCK_CLOSED1 = {
    baseSprite: 'walls_14',
    animName: 'walls-anims_red_door_bck_close1',
    isWall: true,
  };
  replacementTemplates.walls_14 = 'RED_DOOR_BCK_CLOSED1';
  exp.RED_DOOR_BCK_CLOSED2 = {
    baseSprite: 'walls_14',
    animName: 'walls-anims_red_door_bck_close2',
    isWall: true,
  };
  exp.RED_DOOR_FWD_CLOSED1 = {
    baseSprite: 'walls_13',
    animName: 'walls-anims_red_door_fwd_close1',
    isWall: true,
  };
  replacementTemplates.walls_13 = 'RED_DOOR_FWD_CLOSED1';
  exp.RED_DOOR_FWD_CLOSED2 = {
    baseSprite: 'walls_13',
    animName: 'walls-anims_red_door_fwd_close2',
    isWall: true,
  };
  exp.RED_DOOR_BCK_OPEN1 = {
    baseSprite: 'walls_14',
    animName: 'walls-anims_red_door_bck_open1',
    isWall: false,
  };
  exp.RED_DOOR_BCK_OPEN2 = {
    baseSprite: 'walls_14',
    animName: 'walls-anims_red_door_bck_open2',
    isWall: false,
  };
  exp.RED_DOOR_FWD_OPEN1 = {
    baseSprite: 'walls_13',
    animName: 'walls-anims_red_door_fwd_open1',
    isWall: false,
  };
  exp.RED_DOOR_FWD_OPEN2 = {
    baseSprite: 'walls_13',
    animName: 'walls-anims_red_door_fwd_open2',
    isWall: false,
  };
  
  exp.ELEVATOR_BCK_CLOSED1 = {
    baseSprite: 'walls_7',
    animName: 'walls-anims_elevator_bck_close1',
    isWall: true,
  };
  // replacementTemplates.walls_7 = 'ELEVATOR_BCK_CLOSED2';
  exp.ELEVATOR_BCK_CLOSED2 = {
    baseSprite: 'walls_7',
    animName: 'walls-anims_elevator_bck_close2',
    isWall: true,
  };
  exp.ELEVATOR_FWD_CLOSED1 = {
    baseSprite: 'walls_6',
    animName: 'walls-anims_elevator_fwd_close1',
    isWall: true,
  };
  // replacementTemplates.walls_6 = 'ELEVATOR_FWD_CLOSED2';
  exp.ELEVATOR_FWD_CLOSED2 = {
    baseSprite: 'walls_6',
    animName: 'walls-anims_elevator_fwd_close2',
    isWall: true,
  };
  exp.ELEVATOR_BCK_OPEN1 = {
    baseSprite: 'walls_7',
    animName: 'walls-anims_elevator_bck_open1',
    isWall: false,
  };
  exp.ELEVATOR_BCK_OPEN2 = {
    baseSprite: 'walls_7',
    animName: 'walls-anims_elevator_bck_open2',
    isWall: false,
  };
  exp.ELEVATOR_FWD_OPEN1 = {
    baseSprite: 'walls_6',
    animName: 'walls-anims_elevator_fwd_open1',
    isWall: false,
  };
  exp.ELEVATOR_FWD_OPEN2 = {
    baseSprite: 'walls_6',
    animName: 'walls-anims_elevator_fwd_open2',
    isWall: false,
  };
};
