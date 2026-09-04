import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

// Antes esta era a página padrão do create-next-app (logo do Next.js e
// links de documentação) — não tinha relação nenhuma com o app. Agora ela
// só decide para onde mandar o usuário: /login, ou a área do seu role.
export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: perfil } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  redirect(perfil?.role === 'ADMIN' ? '/chefe' : '/entregador');
}
