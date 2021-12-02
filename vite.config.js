import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig((...args) => {
  let rootPath = '../';

  const config = {
    plugins: [
      tsconfigPaths({
        projects: [rootPath + 'tsconfig.vite.json'],
      }),
    ],
    root: '.',
    base: '/regem-ludos',
    publicDir: rootPath + '/res/',
    esbuild: {
      jsxFactory: 'h',
      jsxFragment: 'Fragment',
      // pure: ['console.log', 'console.debug', 'console.warn'],
    },
    build: {
      outDir: rootPath + 'dist',
      assetsDir: 'release',
      cssCodeSplit: false,
    },
    server: {
      open: 'index.html',
      // lets TILED export json directly into project without permission errors in windows
      watch: {
        usePolling: true,
      },
      // proxies iframe requests to the concurrently-running http-server (DUMB that I have to do this)
      // Why can't I just directly load the stuff from here?
      proxy: {
        '^/iframes/.*': 'http://localhost:8080/',
      },
    },
  };
  return config;
});
