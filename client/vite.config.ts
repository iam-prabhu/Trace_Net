import path from 'path';
import fs from 'fs';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import { compile } from 'tailwindcss';

function tailwindPlugin(): Plugin {
  let candidates = new Set<string>();

  function scanDir(dir: string) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (/\.(tsx|ts|jsx|js|html)$/.test(entry.name)) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const matches = content.match(/[\w\-/:[\]#%]+/g);
        if (matches) {
          for (const m of matches) candidates.add(m);
        }
      }
    }
  }

  return {
    name: 'custom-tailwind-v4',
    enforce: 'pre',
    async transform(code: string, id: string) {
      if (id.includes('index.css')) {
        candidates = new Set<string>();
        scanDir(path.resolve(import.meta.dirname, 'src'));
        const indexHtml = path.resolve(import.meta.dirname, 'index.html');
        if (fs.existsSync(indexHtml)) {
          const content = fs.readFileSync(indexHtml, 'utf-8');
          const matches = content.match(/[\w\-/:[\]#%]+/g);
          if (matches) for (const m of matches) candidates.add(m);
        }

        const compiler = await compile(code, {
          base: import.meta.dirname,
          loadStylesheet: async (sheetId: string, base: string) => {
            let resolved = sheetId;
            if (sheetId === 'tailwindcss') {
              const rootTw = path.resolve(import.meta.dirname, '../node_modules/tailwindcss/index.css');
              const localTw = path.resolve(import.meta.dirname, 'node_modules/tailwindcss/index.css');
              resolved = fs.existsSync(rootTw) ? rootTw : localTw;
            } else {
              resolved = path.resolve(base, sheetId);
            }
            return {
              path: resolved,
              content: fs.readFileSync(resolved, 'utf-8'),
              base: path.dirname(resolved),
            };
          },
        });

        const compiled = compiler.build(Array.from(candidates));
        return {
          code: compiled,
          map: null,
        };
      }
    },
  };
}

const rootNodeModules = path.resolve(import.meta.dirname, '../node_modules');

export default defineConfig({
  plugins: [react(), tailwindPlugin()],
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
