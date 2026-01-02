import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Carga las variables de entorno para que estén disponibles en el proceso de build
  // El tercer argumento '' permite cargar todas las variables, no solo las que empiezan con VITE_
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Esto reemplaza 'process.env.API_KEY' en tu código con el valor real de Vercel durante el build
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // Evita errores de "process is not defined" en el navegador
      'process.env': {}
    }
  };
});