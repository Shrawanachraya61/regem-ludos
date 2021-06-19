import { Room, Tile, TILE_WIDTH_WORLD, TILE_HEIGHT_WORLD } from 'model/room';
import { to1dIndex, Point, calculateDistance } from 'utils';

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
let DEBUG = false;

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
      if (DEBUG) {
        console.log('CHECK GET CONNECTIONS NODE', node);
      }
      if (node) {
        if (node.isWall) {
          if (DEBUG) {
            console.log('-- node is wall');
          }
          return false;
        }
        if (nodeBelow && nodeBelow.isWall) {
          if (DEBUG) {
            console.log('-- node below is wall');
          }
          return false;
        }
        if (nodeRight && nodeRight.isWall) {
          if (DEBUG) {
            console.log('-- node right is wall');
          }
          return false;
        }
        if (DEBUG) {
          console.log('-- NODE IS CONNECTED!');
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

const createPFGraphFromRoom = (room: Room): PFGraph => {
  const graph: PFGraph = {
    width: room.width,
    height: room.height,
    nodes: room.tiles.map((tile: Tile) => {
      const node: PFNode = {
        hCost: INFINITY,
        cost: INFINITY,
        isWall: tile.isWall,
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

  const startNode = graph.nodes[to1dIndex(start, graph.width)];

  graph.nodes.forEach((node: PFNode) => {
    node.visited = false;
    // if (node === startNode) {
    //   DEBUG = true;
    // }
    node.connections = getConnections(node, graph);
    DEBUG = false;
  });

  return graph;
};

export const pfPathToRoomPath = (pfPath: PFPath): Point[] => {
  return pfPath.path.map(p => {
    return [p[0] * TILE_WIDTH_WORLD, p[1] * TILE_HEIGHT_WORLD];
  });
};

export const createPFPath = (start: Point, end: Point, room: Room): PFPath => {
  const pfPath: PFPath = {
    path: [],
  };

  const graph = createPFGraphFromRoom(room);
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
            [connectedNode.x, connectedNode.y, 0],
            [endNode.x, endNode.y, 0]
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

  if (ctr === 1000 || openSet.length === 0) {
    console.log(start, end, graph, startNode, endNode);
    console.error('Cannot find path, too long or impossible');
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
