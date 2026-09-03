-- CRUD Operação Esquinas Delivery
create table if not exists clientes (
 id uuid primary key default gen_random_uuid(),
 nome text not null,
 telefone text,
 endereco text,
 created_at timestamp default now()
);

create table if not exists entregas (
 id uuid primary key default gen_random_uuid(),
 cliente_id uuid references clientes(id),
 entregador_id uuid references profiles(id),
 status text default 'PENDENTE',
 created_at timestamp default now()
);

alter table clientes enable row level security;
alter table entregas enable row level security;
