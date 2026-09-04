'use client';

import { createBrowserClient } from '@supabase/ssr';

// IMPORTANTE: usa createBrowserClient (de @supabase/ssr), não createClient
// (de @supabase/supabase-js) puro. A diferença é onde a sessão fica salva:
// createClient() só grava no localStorage, que o middleware.ts (que roda no
// servidor) não consegue ler — causava um loop de redirect pro /login logo
// depois de logar com sucesso. createBrowserClient grava a sessão também
// em cookies, que middleware.ts e lib/supabaseServer.ts conseguem ler.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Evita que o build da Vercel quebre quando este módulo é avaliado durante
// o pré-render de páginas 'use client' (ex.: /chefe, /login, /entregador) e
// as env vars ainda não estão disponíveis nesse momento do processo de build.
// Em runtime, no navegador, avisamos se elas realmente não estiverem configuradas.
if ((!supabaseUrl || !supabaseAnonKey) && typeof window !== 'undefined') {
  console.warn(
    'Variáveis do Supabase ausentes: confira NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY nas Environment Variables da Vercel.'
  );
}

export const supabase = createBrowserClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);
