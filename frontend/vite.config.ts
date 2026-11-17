import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  // Les clés locales servent au serveur de développement uniquement.
  // Le site statique public ne doit pas embarquer .env, même s'il existe.
  envDir: command === 'serve' ? '..' : false,
  plugins: [react()],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  server: {
    host: '127.0.0.1',
  },
}))
