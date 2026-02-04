import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Memuat env vars dari process.cwd()
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Mengekspos API_KEY ke kode client agar process.env.API_KEY dapat terbaca
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    },
  };
});