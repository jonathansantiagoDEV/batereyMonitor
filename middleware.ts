import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { canAccess, areaFromPath } from '@/lib/accessControl';

// Antes este middleware só chamava NextResponse.next() e não bloqueava
// nada (era um TODO). Agora ele: 1) exige sessão válida nas rotas
// protegidas e 2) verifica o role (ADMIN/ENTREGADOR) contra a área
// acessada, usando canAccess() de lib/accessControl.ts.
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('proximo', pathname);
    return NextResponse.redirect(url);
  }

  const area = areaFromPath(pathname);
  if (area) {
    const { data: perfil } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = perfil?.role ?? 'ENTREGADOR';

    if (!canAccess(role, area)) {
      const url = request.nextUrl.clone();
      url.pathname = role === 'ADMIN' ? '/chefe' : '/entregador';
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ['/chefe/:path*', '/entregador/:path*', '/clientes/:path*', '/entregas/:path*', '/perfil/:path*'],
};
