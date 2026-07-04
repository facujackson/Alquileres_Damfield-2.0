import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/Alquileres_Damfield-2.0/',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
});
