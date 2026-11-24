import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

const rootNodeModules = path.resolve(import.meta.dirname, '../node_modules');

export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      'react': path.resolve(rootNodeModules, 'react'),
      'react-dom': path.resolve(rootNodeModules, 'react-dom'),
      'react/jsx-runtime': path.resolve(rootNodeModules, 'react/jsx-runtime'),
      'react/jsx-dev-runtime': path.resolve(rootNodeModules, 'react/jsx-dev-runtime'),
      'lucide-react': path.resolve(rootNodeModules, 'lucide-react/dist/cjs/lucide-react.js'),
    },
    dedupe: ['react', 'react-dom'],
  },
});

