import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

// En développement, /api est relayé vers le backend Fluxio : le navigateur reste
// sur la même origine, donc pas de CORS à configurer et les cookies JWT passent.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.VITE_API_TARGET || 'http://localhost:3000';
  return {
    plugins: [react()],
    server: {
      port: 5175,
      proxy: {
        '/api': { target, changeOrigin: true },
        '/health': { target, changeOrigin: true },
      },
    },
  };
});
