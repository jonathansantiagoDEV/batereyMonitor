import { getProfile } from './profileService';

export type Role = 'ADMIN' | 'ENTREGADOR';
export type Area = 'chefe' | 'entregador' | 'clientes' | 'entregas' | 'perfil';

export async function redirectByRole(userId: string) {
  const profile = await getProfile(userId);
  if (!profile) return '/login';
  // Bug corrigido: a rota do painel ADMIN é "/chefe" (não existe "/dashboard").
  return profile.role === 'ADMIN' ? '/chefe' : '/entregador';
}

export function canAccess(role: string, area: Area) {
  switch (area) {
    case 'chefe':
      return role === 'ADMIN';
    case 'clientes':
    case 'entregas':
      return role === 'ADMIN';
    case 'entregador':
      return role === 'ENTREGADOR' || role === 'ADMIN';
    case 'perfil':
      return role === 'ADMIN' || role === 'ENTREGADOR';
    default:
      return false;
  }
}

export function areaFromPath(pathname: string): Area | null {
  if (pathname.startsWith('/chefe')) return 'chefe';
  if (pathname.startsWith('/clientes')) return 'clientes';
  if (pathname.startsWith('/entregas')) return 'entregas';
  if (pathname.startsWith('/entregador')) return 'entregador';
  if (pathname.startsWith('/perfil')) return 'perfil';
  return null;
}
