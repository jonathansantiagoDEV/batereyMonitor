import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request:NextRequest){
 return NextResponse.next();
}

// TODO: a função middleware() acima ainda não bloqueia nada (só faz next()).
// O matcher aqui só define ONDE ela roda; a checagem real de sessão/role
// (redirectByRole / canAccess, já existentes em lib/accessControl.ts)
// ainda precisa ser plugada dentro da função middleware.
export const config={matcher:['/dashboard/:path*','/entregador/:path*','/chefe/:path*']};
