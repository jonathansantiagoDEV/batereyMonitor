-- Esquinas Delivery
-- Consolidação de schema + Row Level Security.
--
-- Dois problemas reais encontrados no schema versionado:
--
-- 1) schema.sql e operacao.sql definiam "entregas" de duas formas
--    diferentes e incompatíveis (uma com colunas cliente/endereco em
--    texto, outra com cliente_id/entregador_id referenciando outras
--    tabelas). Como ambas usam "create table if not exists", só a que
--    rodou primeiro no banco realmente existe — a outra fica
--    silenciosamente desatualizada. As rotas do app (app/api/rastreio,
--    lib/entregasService.ts) esperam as colunas cliente/endereco/status/
--    entregador_id/token_rastreio, então é isso que este arquivo garante
--    que existe, com ALTER TABLE ... ADD COLUMN IF NOT EXISTS (idempotente
--    e seguro rodar independente de qual das duas versões já existe).
--
-- 2) "clientes" e "entregas" tinham "enable row level security" mas
--    NENHUMA policy — o que bloqueia toda leitura/escrita para todo mundo,
--    inclusive ADMIN. E não existia tabela "entregadores" nem a view
--    "ultimas_localizacoes", que app/chefe, app/entregador e
--    lib/localizacaoService.ts já usam.

-- 1) Tabela entregadores ---------------------------------------------------
create table if not exists public.entregadores (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null unique references public.profiles(id) on delete cascade,
  status text not null default 'AGUARDANDO' check (status in ('AGUARDANDO','EM_ROTA')),
  created_at timestamptz default now()
);

alter table public.entregadores enable row level security;

-- 2) Unifica a tabela entregas ---------------------------------------------
alter table public.entregas
  add column if not exists cliente text,
  add column if not exists endereco text,
  add column if not exists status text default 'PENDENTE',
  add column if not exists entregador_id uuid,
  add column if not exists created_at timestamptz default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'entregas_entregador_id_fkey'
  ) then
    alter table public.entregas
      add constraint entregas_entregador_id_fkey
      foreign key (entregador_id) references public.entregadores(id);
  end if;
end $$;

alter table public.entregas enable row level security;
alter table public.clientes enable row level security;

-- 3) FK de localizacoes -> entregadores ------------------------------------
-- localizacoes.created_at também não existia de fato na base (schema.sql
-- prometia, mas nunca foi aplicado) — mesmo tipo de drift do item 2.
alter table public.localizacoes
  add column if not exists created_at timestamptz default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'localizacoes_entregador_id_fkey'
  ) then
    alter table public.localizacoes
      add constraint localizacoes_entregador_id_fkey
      foreign key (entregador_id) references public.entregadores(id) on delete cascade;
  end if;
end $$;

alter table public.localizacoes enable row level security;

-- 4) Helper para checar ADMIN sem recursão de RLS --------------------------
-- (uma policy em "profiles" que consulta a própria "profiles" causaria
-- recursão infinita; uma função security definer resolve isso)
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'ADMIN'
  );
$$;

-- 5) profiles: faltava o ADMIN conseguir ver os outros perfis -------------
drop policy if exists "admin ve todos os perfis" on public.profiles;
create policy "admin ve todos os perfis"
on public.profiles for select
using (public.is_admin());

-- 6) entregadores -----------------------------------------------------------
drop policy if exists "entregador ve o proprio registro" on public.entregadores;
create policy "entregador ve o proprio registro"
on public.entregadores for select
using (usuario_id = auth.uid() or public.is_admin());

drop policy if exists "entregador cria o proprio registro" on public.entregadores;
create policy "entregador cria o proprio registro"
on public.entregadores for insert
with check (usuario_id = auth.uid());

drop policy if exists "entregador atualiza o proprio registro" on public.entregadores;
create policy "entregador atualiza o proprio registro"
on public.entregadores for update
using (usuario_id = auth.uid() or public.is_admin());

-- 7) localizacoes -----------------------------------------------------------
drop policy if exists "entregador registra a propria localizacao" on public.localizacoes;
create policy "entregador registra a propria localizacao"
on public.localizacoes for insert
with check (
  entregador_id in (select id from public.entregadores where usuario_id = auth.uid())
);

drop policy if exists "leitura de localizacoes" on public.localizacoes;
create policy "leitura de localizacoes"
on public.localizacoes for select
using (
  public.is_admin()
  or entregador_id in (select id from public.entregadores where usuario_id = auth.uid())
);

-- 8) view ultimas_localizacoes ----------------------------------------------
-- Não usamos "create or replace view" porque a view já existia com um
-- formato de colunas diferente, e o Postgres não permite trocar/remover
-- colunas de uma view existente por REPLACE — só recriando do zero.
drop view if exists public.ultimas_localizacoes;

-- security_invoker garante que a RLS das tabelas usadas na view é aplicada
-- com o usuário que consulta a view, e não com o dono dela.
create view public.ultimas_localizacoes
with (security_invoker = true) as
select distinct on (l.entregador_id)
  l.entregador_id,
  p.nome,
  l.latitude,
  l.longitude,
  l.velocidade,
  l.created_at
from public.localizacoes l
join public.entregadores e on e.id = l.entregador_id
join public.profiles p on p.id = e.usuario_id
order by l.entregador_id, l.created_at desc;

-- 9) entregas -----------------------------------------------------------
drop policy if exists "admin gerencia entregas" on public.entregas;
create policy "admin gerencia entregas"
on public.entregas for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "entregador ve as proprias entregas" on public.entregas;
create policy "entregador ve as proprias entregas"
on public.entregas for select
using (
  entregador_id in (select id from public.entregadores where usuario_id = auth.uid())
);

drop policy if exists "entregador atualiza status das proprias entregas" on public.entregas;
create policy "entregador atualiza status das proprias entregas"
on public.entregas for update
using (entregador_id in (select id from public.entregadores where usuario_id = auth.uid()))
with check (entregador_id in (select id from public.entregadores where usuario_id = auth.uid()));

-- 10) clientes ------------------------------------------------------------
drop policy if exists "admin gerencia clientes" on public.clientes;
create policy "admin gerencia clientes"
on public.clientes for all
using (public.is_admin())
with check (public.is_admin());
