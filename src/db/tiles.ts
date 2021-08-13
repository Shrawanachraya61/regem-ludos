import { Point } from 'utils';

interface TileTemplate {
  baseSprite: string;
  animName?: string;
  isWall?: boolean;
  isProp?: boolean;
  pxOffset?: Point;
  size?: Point;
  hasFloorTile?: boolean;
  floorTile?: string;
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
  exp.TALL_RED_DOOR_BCK_OPEN = {
    baseSprite: 'walls128_2',
    animName: 'walls128-anims_tall_red_door_bck_open',
    isWall: false,
  };
  exp.TALL_RED_DOOR_BCK_CLOSED = {
    baseSprite: 'walls128_2',
    animName: 'walls128-anims_tall_red_door_bck_closed',
    isWall: true,
  };

  exp.KIOSK_STATS_ACTIVE = {
    baseSprite: 'props_26',
    animName: 'tile_vr_portal_active',
    isWall: true,
    isProp: false,
  };
  exp.KIOSK_STATS_PASSIVE = {
    baseSprite: 'props_26',
    animName: 'tile_vr_portal_passive',
    isWall: true,
    isProp: false,
  };
  exp.SAVE_POINT_ACTIVE = {
    baseSprite: 'props_30',
    animName: 'tile_save_point_active',
    isWall: true,
    isProp: false,
    size: [32, 64],
  };
  exp.SAVE_POINT_PASSIVE = {
    baseSprite: 'props_30',
    animName: 'tile_save_point_passive',
    isWall: true,
    isProp: false,
    size: [32, 64],
  };
  exp.SAVE_POINT_PASSIVE_INITIAL = {
    baseSprite: 'props_30',
    animName: 'tile_save_point_passive_initial',
    isWall: true,
    isProp: false,
  };
  replacementTemplates.props_30 = 'SAVE_POINT_PASSIVE_INITIAL';
  exp.VR_PORTAL_FLOOR = {
    baseSprite: 'floors_15',
    animName: 'tile_vr_portal_floor_anim',
  };
  replacementTemplates.floors_15 = 'VR_PORTAL_FLOOR';
  exp.TUT_GATE_FLOOR = {
    baseSprite: 'floors_59',
    animName: 'floors_59',
    isWall: false,
    hasFloorTile: false,
    size: [32, 32],
    // calculated based on height of the bridge wall tile (I did it manually cuz I'm lazy)
    pxOffset: [0, 48],
  };
  exp.TUT_GATE = {
    baseSprite: 'walls_18',
    animName: 'walls_18',
    isWall: true,
    // hasFloorTile: true,
    size: [32, 64],
  };
  exp.TUT_GATE_YELLOW = {
    baseSprite: 'walls_19',
    // animName: 'walls_19',
    isWall: true,
    // hasFloorTile: true,
    floorTile: 'TUT_GATE_FLOOR',
    size: [32, 64],
    // pxOffset: [0, -4],
  };
  exp.TUT_GATE_BLUE = {
    baseSprite: 'walls_20',
    // animName: 'walls_20',
    isWall: true,
    floorTile: 'TUT_GATE_FLOOR',
    // hasFloorTile: true,
    size: [32, 64],
  };
  exp.TUT_GATE_PURPLE = {
    baseSprite: 'walls_21',
    // animName: 'walls_21',
    isWall: true,
    floorTile: 'TUT_GATE_FLOOR',
    // hasFloorTile: true,
    size: [32, 64],
  };
  exp.TUT_GATE_RED = {
    baseSprite: 'walls_22',
    // animName: 'walls_22',
    isWall: true,
    floorTile: 'TUT_GATE_FLOOR',
    // hasFloorTile: true,
    size: [32, 64],
  };
  exp.HEAL_POOL = {
    baseSprite: 'props_29',
    animName: 'tile_heal_pool_anim',
    isWall: true,
    isProp: true,
    // floorTile: 'TUT_GATE_FLOOR',
    // hasFloorTile: true,
    size: [32, 64],
  };
  replacementTemplates.props_29 = 'HEAL_POOL';

  exp.PROPS_BOWLING_DISPENSER = {
    baseSprite: 'props_32',
    // animName: 'tile_heal_pool_anim',
    isWall: true,
    isProp: true,
    // floorTile: 'TUT_GATE_FLOOR',
    // hasFloorTile: true,
    // size: [32, 64],
  };
  replacementTemplates.props_32 = 'PROPS_BOWLING_DISPENSER';

  exp.TIC_TAC_TOE_EXCITED = {
    baseSprite: 'props_12',
    animName: 'props-anims-tic-tac-toe-machine-excited',
    isWall: true,
    isProp: true,
    size: [32, 64],
  };
  exp.TIC_TAC_TOE_NORMAL = {
    baseSprite: 'props_12',
    // animName: 'props-anims-tic-tac-toe-machine-excited',
    isWall: true,
    isProp: true,
    size: [32, 64],
  };
};
