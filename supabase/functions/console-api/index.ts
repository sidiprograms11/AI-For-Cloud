import { createHandler } from './handler.ts'

const namedKeys = JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS') || '{}')
const publicKey = namedKeys.default || Deno.env.get('SUPABASE_PUBLISHABLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || ''

Deno.serve(createHandler({
  url: Deno.env.get('SUPABASE_URL') || '',
  publicKey,
  allowedOrigins: (Deno.env.get('CONSOLE_ALLOWED_ORIGINS') || 'https://ai-kora.cloud,https://www.ai-kora.cloud,https://kora-ai-for-cloud-prototype.sidigano8.chatgpt.site,http://127.0.0.1:5173,http://localhost:5173').split(',').map((value) => value.trim()).filter(Boolean),
}))
