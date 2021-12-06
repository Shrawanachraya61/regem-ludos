import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import sourceMaps from 'rollup-plugin-sourcemaps';
import typescript from 'rollup-plugin-typescript2';
import serve from 'rollup-plugin-serve-proxy';
import replace from '@rollup/plugin-replace';
import reactSvg from 'rollup-plugin-react-svg';
import { terser } from 'rollup-plugin-terser';
import { visualizer } from 'rollup-plugin-visualizer';
import filesize from 'rollup-plugin-filesize';

const libraryName = 'main';
const isProduction = process.env.NODE_ENV === 'production';
const isAnalyze = process.env.ANALYZE === 'true';

console.log('\nisProduction', isProduction);
console.log('isAnalyze', isAnalyze);

export default {
  input: `src/index.ts`,
  output: [
    isProduction
      ? {
          file: `dist/main.js`,
          name: libraryName,
          format: 'umd',
          plugins: [terser()],
          sourcemap: false,
        }
      : {
          file: `public/main.js`,
          name: libraryName,
          format: 'umd',
          sourcemap: true,
        },
  ],
  context: 'window',
  // Indicate here external modules you don't wanna include in your bundle (i.e.: 'lodash')
  watch: {
    include: 'src/**',
  },
  // external: ['styled-components'],
  // globals: { 'styled-components': 'styled' },
  plugins: [
    // Compile TypeScript files
    reactSvg({
      // svgo options
      svgo: {
        plugins: [], // passed to svgo
        multipass: true,
      },

      // whether to output jsx
      jsx: false,

      // include: string
      include: null,

      // exclude: string
      exclude: null,
    }),
    typescript({ useTsconfigDeclarationDir: true }),
    replace({
      'process.env.NODE_ENV': JSON.stringify(
        isProduction ? 'production' : 'development'
      ),
      __buildDate__: () => JSON.stringify(new Date()),
      __buildVersion: '15',
      preventAssignment: true,
    }),
    // Allow bundling cjs modules (unlike webpack, rollup doesn't understand cjs)
    commonjs({
      ignoreGlobal: true,
      include: 'node_modules/**',
      namedExports: {
        'react-dom': ['render'],
        react: Object.keys(require('react')),
        'react-is': Object.keys(require('react-is')),
        'prop-types': Object.keys(require('prop-types')),
        '@material-ui/utils/node_modules/react-is': Object.keys(
          require('react-is')
        ),
      },
    }),
    resolve(),
    isAnalyze ? visualizer() : undefined,
    // Resolve source maps to the original source
    isProduction ? undefined : sourceMaps(),
    isProduction ? filesize() : undefined,

    isProduction
      ? undefined
      : serve({
          open: true,
          openPage: '/regem-ludos-bowling/public/index.html',
          verbose: true,
          contentBase: '../',
        }),
  ],
};
