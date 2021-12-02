import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { resolve } from 'path';

export default defineConfig(() => {
  const config = {
    plugins: [
      tsconfigPaths({
        projects: ['../tsconfig.vite.json'],
      }),
    ],
    root: '.',
    publicDir: '../res/',
    esbuild: {
      jsxFactory: 'h',
      jsxFragment: 'Fragment',
      // pure: ['console.log', 'console.debug', 'console.warn'],
    },
    build: {
      outDir: '../dist',
      assetsDir: 'release',
      cssCodeSplit: false,
      // rollupOptions: {
      //   external: ['styles.css'],
      // },
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
