import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    // Identificador del despliegue. Se usa para que la URL del
    // índice de búsqueda cambie en cada build de Vercel y el
    // navegador no reutilice una respuesta HTTP antigua. La caché
    // propia de la app tiene su TTL y se encarga del resto.
    define: {
      __BUILD_ID__: JSON.stringify(process.env.VERCEL_GIT_COMMIT_SHA || 'dev'),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
