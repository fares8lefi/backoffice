import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

// En développement, /api est relayé vers le backend Fluxio : le navigateur reste
// sur la même origine, donc pas de CORS à configurer et les cookies JWT passent.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = (env.VITE_API_TARGET || 'http://localhost:3000').replace(/\/$/, '');
  // Le navigateur envoie Origin: http://localhost:5175, que le backend distant refuse
  // (originCheck). Côté backend, la requête relayée devient alors une requête serveur à serveur.
  const proxy = {
    target,
    changeOrigin: true,
    secure: true,
    cookieDomainRewrite: '',
    configure: (p) =>
      p.on('proxyReq', (proxyReq) => {
        proxyReq.removeHeader('origin');
        proxyReq.removeHeader('referer');
      }),
  };
  return {
    plugins: [react()],
    server: {
      port: 5175,
      proxy: {
        '/api': proxy,
        '/health': proxy,
      },
    },
  };
});
