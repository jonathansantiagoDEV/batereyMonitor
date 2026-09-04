import 'server-only';
import { createClient } from '@supabase/supabase-js';

// ATENÇÃO: este client usa a SERVICE ROLE KEY e ignora RLS.
// Nunca importe este arquivo em componentes 'use client' nem exponha
// SUPABASE_SERVICE_ROLE_KEY com o prefixo NEXT_PUBLIC_.
// Use apenas em route handlers / server components (app/api/**, etc).

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    'SUPABASE_SERVICE_ROLE_KEY não configurada. Defina no .env.local (nunca com prefixo NEXT_PUBLIC_).'
  );
}

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
