
-- Tabela de perfis vinculada ao Supabase Auth

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text,
  telefone text,
  role text not null default 'ENTREGADOR'
    check (role in ('ADMIN','ENTREGADOR')),
  avatar text,
  ativo boolean default true,
  created_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;

create policy "usuario ve proprio perfil"
on public.profiles
for select
using (auth.uid() = id);

create policy "usuario atualiza proprio perfil"
on public.profiles
for update
using (auth.uid() = id);

-- Trigger para criar perfil automaticamente após cadastro
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id,nome)
  values (new.id, new.raw_user_meta_data->>'nome');
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
