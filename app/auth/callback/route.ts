import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

// Rota de callback do OAuth (ex.: Google). O Supabase redireciona o
// navegador pra cá com um "code" na querystring depois que o usuário
// autoriza o login na tela do Google. Aqui a gente troca esse code por
// uma sessão de verdade (grava os cookies via lib/supabaseServer) e só
// então decide pra onde mandar o usuário, olhando o role em "profiles"
// — igual o login por senha já faz em app/login/page.tsx.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Nesse ponto o trigger handle_new_user() (supabase/profiles.sql)
        // já rodou — ele dispara em "after insert on auth.users", então
        // no primeiro login via Google o profile já existe com
        // role = 'ENTREGADOR' (default da coluna).
        const { data: perfil } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        const destino = perfil?.role === 'ADMIN' ? '/chefe' : '/entregador';
        return NextResponse.redirect(`${origin}${destino}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?erro=auth`);
}
