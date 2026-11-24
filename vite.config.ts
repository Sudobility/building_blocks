import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        firebase: resolve(__dirname, 'src/firebase.ts'),
      },
      name: 'BuildingBlocks',
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        /^react(\/|$)/,
        /^react-dom(\/|$)/,
        /^@heroicons\/react(\/|$)/,
        /^@sudobility\//,
        /^@tanstack\//,
        /^firebase(\/|$)/,
        'class-variance-authority',
        'clsx',
        /^i18next/,
        'react-helmet-async',
        'react-i18next',
        'react-router-dom',
        'tailwind-merge',
        /^zustand(\/|$)/,
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
    sourcemap: true,
    minify: false,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
