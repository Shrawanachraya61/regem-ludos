/*
global
TILE_SIZE
*/

interface Tile {
  name: string;
  id: number;
  size: number;
  x: number;
  y: number;
  wall: boolean;
  fill: string;
  stroke: string;
}

const model_tileDatabase = {
  0: {
    name: 'Floor',
  },
  1: {
    name: 'Wall',
    wall: true,
  },
  2: {
    name: 'Crumbling Wall',
    wall: true,
  },
  3: {
    name: 'Water',
    wall: true,
  },
  4: {
    name: 'Evil Statue',
    wall: true,
  },
  5: {
    name: 'Medical Statue',
    wall: true,
  },
  6: {
    name: 'Stable Ground',
  },
  7: {
    name: 'Closed Gate',
    wall: true,
  },
  8: {
    name: 'Open Gate',
  },
  9: {
    name: 'Button',
  },
  10: {
    name: 'Chest',
    wall: true,
  },
};

const G_model_createTile = (id: number, x: number, y: number): Tile => {
  const tileTemplate = model_tileDatabase[id];

  if (!tileTemplate) {
    throw Error('No tile template with id:' + id);
  }

  return {
    name: tileTemplate.name,
    id,
    x,
    y,
    size: TILE_SIZE,
    fill: '',
    stroke: '',
    wall: !!tileTemplate.wall,
  };
};
