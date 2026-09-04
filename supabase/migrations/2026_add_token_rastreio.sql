-- Esquinas Delivery
-- Adiciona coluna de token público de rastreio na tabela entregas.
--
-- Contexto: o cliente final acessa um link público (/rastreio/[token]) SEM
-- fazer login. Como as policies de RLS de "entregas" exigem auth.uid(),
-- essa leitura NÃO pode ir direto do navegador do cliente para o Supabase.
-- Em vez disso, o token é resolvido no servidor, pela rota de API
-- /api/rastreio/[token] (Next.js, server-side), usando a service role key.
--
-- Esse ALTER já foi executado manualmente em produção via SQL Editor do
-- Supabase (rodou com sucesso). Este arquivo só documenta a mudança no
-- schema versionado do repositório, para manter schema.sql/operacao.sql
-- sincronizados com o banco real.

alter table entregas
  add column if not exists token_rastreio text unique default gen_random_uuid()::text;

create index if not exists idx_entregas_token_rastreio
  on entregas (token_rastreio);
