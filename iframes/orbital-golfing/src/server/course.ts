interface Course {
  name: string;
  holes: Hole[];
}

interface Hole {
  width: number;
  height: number;
  par: number;
  planets: PlanetTemplate[];
  flags: FlagTemplate[];
  start: [number, number];
}

interface PlanetTemplate {
  x: number;
  y: number;
  r: number;
  mass?: number;
  color?: string;
}

interface FlagTemplate {
  x: number;
  y: number;
}

// var courseStorage: Course[] = [
//   // {
//   //   name: 'test',
//   //   holes: [
//   //     {
//   //       width: 2019600000000,
//   //       height: 2019600000000,
//   //       par: 2,
//   //       planets: [
//   //         {
//   //           x: 1077120000000,
//   //           y: 1432170666667,
//   //           r: 119680000000,
//   //           mass: 1e32,
//   //         },
//   //       ],
//   //       flags: [
//   //         {
//   //           x: -1077120000000,
//   //           y: 1432170666667,
//   //         },
//   //       ],
//   //       start: [0, 0],
//   //     },
//   //   ],
//   // },
// ];

const courseGetByName = (name: string): Course | undefined => {
  return courseStorage.find(c => c.name === name);
};
