'use client';

import { createBrowserClient } from '@supabase/ssr';

// IMPORTANTE: usa createBrowserClient (de @supabase/ssr), não createClient
// (de @supabase/supabase-js) puro. A diferença é onde a sessão fica salva:
// createClient() só grava no localStorage, que o middleware.ts (que roda no
// servidor) não consegue ler — causava um loop de redirect pro /login logo
// depois de logar com sucesso. createBrowserClient grava a sessão também
// em cookies, que middleware.ts e lib/supabaseServer.ts conseguem ler.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
