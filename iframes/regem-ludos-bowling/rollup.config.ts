import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import sourceMaps from 'rollup-plugin-sourcemaps';
import typescript from 'rollup-plugin-typescript2';
import minify from 'rollup-plugin-babel-minify';
const pkg = require('./package.json');

const libraryName = pkg.name;

export default {
  input: `src/${libraryName}.ts`,
  output: [
    {
      file: `dist/${pkg.main}`,
      name: libraryName,
      format: 'umd',
      sourcemap: true,
    },
    {
      file: `${pkg.main}`,
      name: libraryName,
      format: 'umd',
      sourcemap: true,
    },
    { file: `dist/${pkg.module}`, format: 'es', sourcemap: true },
  ],
  // Indicate here external modules you don't wanna include in your bundle (i.e.: 'lodash')
  external: [],
  watch: {
    include: 'src/**',
  },
  plugins: [
    // Compile TypeScript files
    typescript({ useTsconfigDeclarationDir: true }),
    // Allow bundling cjs modules (unlike webpack, rollup doesn't understand cjs)
    commonjs(),
    // Allow node_modules resolution, so you can use 'external' to control
    // which external modules to include in the bundle
    // https://github.com/rollup/rollup-plugin-node-resolve#usage
    resolve(),
    minify(),
    // Resolve source maps to the original source
    sourceMaps(),
  ],
};
