-- Laboratório da Água — Correção de sincronização V4 (19/10/2026)
-- Execute uma única vez no SQL Editor do projeto Supabase JÁ em uso.
-- PRESERVA perfis, progresso, tabelas, tentativas e notas existentes.
-- Pré-requisito: setup.sql e upgrade_v2.sql já executados.

begin;

-- Identificador estável gerado pelo navegador. Permite reenvio sem duplicar
-- uma nota quando a rede falha depois de o banco receber a primeira requisição.
alter table public.advanced_attempts
  add column if not exists client_attempt_id text;
create unique index if not exists advanced_attempts_user_client_id_uniq
  on public.advanced_attempts(user_id,client_attempt_id)
  where client_attempt_id is not null;

-- Reforçar permissões já definidas na v2, sem alterar RLS nem perfis.
grant select, insert on public.advanced_attempts to authenticated;
grant usage, select on sequence public.advanced_attempts_id_seq to authenticated;

commit;
notify pgrst, 'reload schema';

-- Confirme que a coluna existe (uma linha) e acompanhe a contagem de notas.
select column_name,data_type from information_schema.columns
 where table_schema='public' and table_name='advanced_attempts'
 and column_name='client_attempt_id';
select count(*) as avaliacoes_avancadas_existentes from public.advanced_attempts;
