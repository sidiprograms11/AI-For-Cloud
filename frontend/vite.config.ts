import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import shared from '../infra/console.public.json'

export default defineConfig(({ command }) => {
  if (shared.supabaseUrl && (!/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(shared.supabaseUrl) || !shared.publishableKey.startsWith('sb_publishable_'))) {
    throw new Error('La configuration partagée exige une URL Supabase HTTPS et une clé publishable.')
  }
  return {
  // Les clés locales servent au serveur de développement uniquement.
  // Le site statique public ne doit pas embarquer .env, même s'il existe.
  envDir: command === 'serve' ? '..' : false,
  define: command === 'build' ? {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(shared.supabaseUrl),
    'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(shared.publishableKey),
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify(shared.supabaseUrl ? `${shared.supabaseUrl}/functions/v1/console-api` : ''),
  } : {},
  plugins: [react()],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  server: {
    host: '127.0.0.1',
  },
  }
})
