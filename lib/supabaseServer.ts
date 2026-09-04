import 'server-only';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// Client Supabase para uso em Server Components / route handlers, que lê a
// sessão a partir dos cookies da requisição (diferente de lib/supabaseClient,
// que só funciona no navegador). Nunca importar este arquivo em código
// 'use client'.
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // "set" chamado a partir de um Server Component: pode ser
            // ignorado com segurança se houver middleware renovando a sessão.
          }
        },
      },
    }
  );
}
