import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: { index: 'src/index.ts' },
    format: ['esm', 'cjs', 'iife'],
    globalName: 'ChimeKit',
    dts: true,
    sourcemap: true,
    clean: true,
    minify: true,
    outExtension({ format }) {
      if (format === 'iife') return { js: '.global.js' };
      return { js: format === 'cjs' ? '.cjs' : '.js' };
    },
  },
  {
    entry: { react: 'src/adapters/react.tsx' },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    minify: true,
    external: ['react', 'chimekit'],
  },
  {
    entry: { angular: 'src/adapters/angular.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    minify: true,
    external: ['@angular/core', 'chimekit'],
  },
  {
    entry: { vue: 'src/adapters/vue.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    minify: true,
    external: ['vue', 'chimekit'],
  },
]);
