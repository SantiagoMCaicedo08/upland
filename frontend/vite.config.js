import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// El puerto es fijo porque forma parte del origen que el backend permite por CORS
// (CORS_ORIGENES en application.yml). strictPort hace que Vite falle si está ocupado, en
// vez de cambiarse en silencio a otro puerto que el backend rechazaría.
export default defineConfig({
  plugins: [react()],
  server: { port: 5500, strictPort: true },
  preview: { port: 5500, strictPort: true },
});
