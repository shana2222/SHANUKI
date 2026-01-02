import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Carga variables desde archivos .env (si existen)
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // Prioridad: 1. Variable del sistema (Vercel CI/CD), 2. Variable cargada por Vite (.env)
  const apiKey = process.env.API_KEY || env.API_KEY;

  return {
    plugins: [react()],
    define: {
      // Inyecta el valor de la API Key en el código del cliente
      'process.env.API_KEY': JSON.stringify(apiKey),
      // Polyfill seguro para process.env para evitar crashes, sin sobrescribir la API_KEY
      'process.env': {} 
    }
  };
});