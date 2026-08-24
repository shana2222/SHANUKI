import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Carga variables desde archivos .env (si existen)
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // Prioridad: 1. Variable del sistema (Vercel CI/CD), 2. Variable cargada por Vite (.env)
  const apiKey = process.env.API_KEY || env.API_KEY;

  return {
    plugins: [react()],
    server: {
      allowedHosts: ['.vercel.run', 'localhost'],
    },
    define: {
      // La app usa el SDK web de Google GenAI, por eso esta variable debe quedar
      // disponible explícitamente en el bundle del navegador.
      'process.env.API_KEY': JSON.stringify(apiKey || '')
    }
  };
});
