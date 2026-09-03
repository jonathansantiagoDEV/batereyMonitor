import { getProfile } from './profileService';

export async function redirectByRole(userId:string){
  const profile = await getProfile(userId);
  if(!profile) return '/login';
  return profile.role === 'ADMIN' ? '/dashboard' : '/entregador';
}

export function canAccess(role:string, area:string){
  if(area === 'dashboard') return role === 'ADMIN';
  if(area === 'entregador') return role === 'ENTREGADOR' || role === 'ADMIN';
  return false;
}
