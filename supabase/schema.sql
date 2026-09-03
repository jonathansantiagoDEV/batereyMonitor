
-- Esquinas Delivery V2
-- Estrutura inicial Supabase

create table if not exists profiles (
 id uuid primary key,
 nome text,
 telefone text,
 tipo text default 'entregador',
 created_at timestamp default now()
);

create table if not exists entregas (
 id uuid primary key default gen_random_uuid(),
 cliente text,
 endereco text,
 status text default 'PENDENTE',
 entregador_id uuid,
 created_at timestamp default now()
);

create table if not exists localizacoes (
 id uuid primary key default gen_random_uuid(),
 entregador_id uuid,
 latitude double precision,
 longitude double precision,
 velocidade double precision,
 created_at timestamp default now()
);
