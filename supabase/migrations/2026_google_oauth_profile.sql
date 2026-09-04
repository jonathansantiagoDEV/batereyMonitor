-- Esquinas Delivery
-- Ajusta o trigger handle_new_user() (criado em supabase/profiles.sql) para
-- também funcionar bem com login via Google.
--
-- Contexto: o trigger já dispara em "after insert on auth.users" para
-- QUALQUER método de autenticação, então ele já cria a linha em
-- "profiles" (com role = 'ENTREGADOR', o default da coluna) no primeiro
-- login via Google também — nada quebra sem esta migration.
--
-- O que este arquivo melhora: o Google não manda a chave "nome" em
-- raw_user_meta_data (a função original só olhava essa chave); ele manda
-- "full_name"/"name" e "avatar_url"/"picture". Sem este ajuste, o perfil
-- de quem entra via Google fica com nome/avatar em branco (o app já lida
-- bem com isso, mostrando "Não informado", mas fica sem o dado que dá
-- pra ter de graça).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nome, avatar)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'nome',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name'
    ),
    coalesce(
      new.raw_user_meta_data->>'avatar',
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    )
  );
  return new;
end;
$$;

-- O trigger em si (on_auth_user_created) não muda, só a função que ele
-- chama — não precisa recriar o trigger, só a function acima já é o
-- suficiente porque ele já aponta pra "public.handle_new_user()".
