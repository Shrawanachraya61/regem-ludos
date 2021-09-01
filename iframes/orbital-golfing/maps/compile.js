const fs = require('fs');

const MIN_MASS = 5e29;
const MAX_MASS = 5e32;
const G_SCALE = 75 / (149.6e6 * 1000);
const MIN_RADIUS = 10 / G_SCALE;
const MAX_RADIUS = 500 / G_SCALE;

const GID_PLAYER_START = 1;
const GID_MINE = 2;
const GID_FLAG = 3;
const GID_COIN = 4;

const normalize = (x, A, B, C, D) => {
  return C + ((x - A) * (D - C)) / (B - A);
};

function easeOut(t, b, c, d) {
  const t2 = t / d;
  return -c * t2 * (t2 - 2) + b;
}

function easeIn(x, a, b, c, d) {
  const t = normalize(x, a, b, 0, 1);
  return normalize(1 - Math.cos((t * Math.PI) / 2), 0, 1, c, d);
}

const normalizeEaseOut = (x, a, b, c, d) => {
  const t = normalize(x, a, b, 0, 1);
  return easeOut(t, c, d - c, 1);
};

const normalizeEaseIn = (x, a, b, c, d) => {
  return easeIn(x, a, b, c, d);
};

const reducePrecision = num => {
  return Math.round(num / 10000) * 10000;
};

const course = {
  name: 'test',
  holes: [],
};

for (let i = 0; i < 4; i++) {
  const fileName = __dirname + '/hole' + (i + 1) + '.json';
  const file = JSON.parse(fs.readFileSync(fileName).toString());
  console.log('FILE', fileName);
  const objects = file.layers.find(l => l.type === 'objectgroup').objects;

  const width = (file.width * 32) / G_SCALE;
  const height = (file.height * 32) / G_SCALE;

  const planets = [];
  const flags = [];
  let start = [];

  objects.forEach(object => {
    const isPlanet = object.ellipse;
    const x =
      normalize(
        object.x + 16,
        0,
        file.width * 32,
        -file.width * 32,
        file.width * 32
      ) / G_SCALE;
    const y =
      normalize(
        object.y - 16,
        0,
        file.height * 32,
        file.height * 32,
        -file.height * 32
      ) / G_SCALE;

    if (isPlanet) {
      const x =
        normalize(
          object.x + object.width / 2,
          0,
          file.width * 32,
          -file.width * 32,
          file.width * 32
        ) / G_SCALE;
      const y =
        normalize(
          object.y + object.height / 2,
          0,
          file.height * 32,
          file.height * 32,
          -file.height * 32
        ) / G_SCALE;

      const r = object.width / G_SCALE;
      planets.push({
        x: reducePrecision(Math.floor(x)),
        y: reducePrecision(Math.floor(y)),
        r: reducePrecision(Math.floor(r)),
        mass: Math.floor(
          normalizeEaseIn(r, MIN_RADIUS, MAX_RADIUS, MIN_MASS, MAX_MASS)
        ),
      });
    } else if (object.gid === GID_PLAYER_START) {
      start = [reducePrecision(Math.floor(x)), reducePrecision(Math.floor(y))];
    } else if (object.gid === GID_MINE) {
      // not implemented yet
    } else if (object.gid === GID_FLAG) {
      flags.push({
        x: reducePrecision(Math.floor(x)),
        y: reducePrecision(Math.floor(y)),
      });
    } else if (object.gid === GID_COIN) {
      // not implemented yet
    }
  });

  course.holes.push({
    width: reducePrecision(Math.floor(width)),
    height: reducePrecision(Math.floor(height)),
    par: file.properties?.find(prop => prop.name === 'par')?.value ?? 2,
    planets,
    flags,
    start,
  });
}

const outFile = __dirname + '/../src/server/course.test.ts';
fs.writeFileSync(
  outFile,
  `var courseStorage = [${JSON.stringify(course, null, 2)} as Course];`
);

console.log('wrote', outFile);
