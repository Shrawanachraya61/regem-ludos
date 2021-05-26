/*
globals
TILE_SIZE
G_model_roomGetUnitAt
G_model_roomGetTileAt
*/

type Point = [number, number];

const to1dIndex = (point: Point, width: number) => {
  return point[1] * width + (point[0] % width);
};
const calculateDistance = (a: Point, b: Point) => {
  const [x1, y1] = a;
  const [x2, y2] = b;
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

interface PFGraph {
  nodes: PFNode[];
  width: number;
  height: number;
}

interface PFNode {
  hCost: number;
  cost: number;
  isWall: boolean;
  x: number;
  y: number;
  tile: Tile;
  connections: PFNodeConnection[];
  parent?: PFNode;
  visited?: boolean;
}

interface PFNodeConnection {
  node: PFNode;
  cost: number;
}

interface PFPath {
  path: Point[];
}

const INFINITY = 9999999;

const getConnections = (node: PFNode, graph: PFGraph) => {
  const nodeAbove = graph.nodes[to1dIndex([node.x, node.y - 1], graph.width)];
  const nodeLeft = graph.nodes[to1dIndex([node.x - 1, node.y], graph.width)];
  const nodeBelow = graph.nodes[to1dIndex([node.x, node.y + 1], graph.width)];
  const nodeRight = graph.nodes[to1dIndex([node.x + 1, node.y], graph.width)];

  if (node.isWall) {
    return [];
  }

  return [nodeAbove, nodeLeft, nodeBelow, nodeRight]
    .filter(node => {
      if (node) {
        if (node.isWall) {
          return false;
        }
        return true;
      } else {
        return false;
      }
    })
    .map(n => {
      const connection: PFNodeConnection = {
        node: n,
        cost: 1,
      };
      return connection;
    });
};

const createPFGraphFromRoom = (
  room: Room,
  allegiance: UnitAllegiance
): PFGraph => {
  const graph: PFGraph = {
    width: room.w,
    height: room.h,
    nodes: room.tiles.map((tile: Tile) => {
      let isWall = tile.wall;
      const unit = G_model_roomGetUnitAt(room, tile.x, tile.y);
      if (unit && unit.allegiance !== allegiance) {
        isWall = true;
      }
      const node: PFNode = {
        hCost: INFINITY,
        cost: INFINITY,
        isWall,
        x: tile.x,
        y: tile.y,
        connections: [],
        tile,
        visited: false,
      };
      return node;
    }),
  };
  return graph;
};

const setupPFGraph = (start: Point, end: Point, graph: PFGraph) => {
  const endNode = graph.nodes[to1dIndex(end, graph.width)];
  if (!endNode) {
    console.error(start, end, graph);
    throw new Error('Cannot setupPFGraph: End point is not in PFGraph');
  }

  graph.nodes.forEach((node: PFNode) => {
    node.visited = false;
    node.connections = getConnections(node, graph);
  });

  return graph;
};

const G_controller_createPFPath = (
  start: Point,
  end: Point,
  room: Room,
  allegiance: UnitAllegiance
): PFPath => {
  const pfPath: PFPath = {
    path: [],
  };

  const graph = createPFGraphFromRoom(room, allegiance);
  setupPFGraph(start, end, graph);

  const startNode = graph.nodes[to1dIndex(start, graph.width)];
  if (!startNode) {
    console.error(start, end, graph);
    throw new Error('Cannot createPFPath: Start point is not in PFGraph');
  }
  const endNode = graph.nodes[to1dIndex(end, graph.width)];
  if (!endNode) {
    console.error(start, end, graph);
    throw new Error('Cannot createPFPath: End point is not in PFGraph');
  }

  if (startNode === endNode) {
    pfPath.path = [[startNode.x, startNode.y]];
    return pfPath;
  }

  if (endNode.isWall) {
    return pfPath;
  }

  let openSet: PFNode[] = [startNode];

  const sortOpenSet = () => {
    openSet = openSet.sort((a, b) => {
      return a.hCost < b.hCost ? -1 : 1;
    });
  };

  startNode.cost = 0;
  startNode.hCost = 0;

  let ctr = 0;
  while (openSet.length && ctr < 500) {
    const node = openSet.shift();

    if (node === endNode) {
      // foundPath
      break;
    }

    if (!node) {
      break;
    }

    for (let i = 0; i < node.connections.length; i++) {
      const { node: connectedNode, cost: connectedCost } = node.connections[i];
      const costToNodeFromHere = node.cost + connectedCost;
      if (costToNodeFromHere < connectedNode.cost) {
        connectedNode.cost = costToNodeFromHere;
        connectedNode.hCost =
          costToNodeFromHere +
          calculateDistance(
            [connectedNode.x, connectedNode.y],
            [endNode.x, endNode.y]
          );
        connectedNode.parent = node;
        if (!openSet.includes(connectedNode)) {
          openSet.push(connectedNode);
        }
      }
    }

    sortOpenSet();
    ctr++;
  }

  if (ctr === 1000 || !endNode.parent) {
    console.log(start, end, graph, startNode, endNode);
    console.error(
      'Cannot find path, too long or impossible',
      ctr,
      openSet.length
    );
    return pfPath;
  }

  let traceNode: PFNode | undefined = endNode;
  do {
    pfPath.path.push([traceNode.x, traceNode.y]);
    traceNode = traceNode.parent;
  } while (traceNode && traceNode.parent);
  pfPath.path = pfPath.path.reverse();

  return pfPath;
};
