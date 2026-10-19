-- Laboratório da Água — atualização incremental para o NÍVEL 2.
-- EXECUTAR no SQL Editor do MESMO projeto Supabase que já possui os dados da versão 1.
-- NÃO apaga nem altera public.exam_attempts ou public.module_progress (versão 1).
-- Exige que o setup.sql original já esteja instalado.

begin;

create table if not exists public.advanced_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  module_no smallint not null check(module_no between 1 and 5),
  completed_at timestamptz not null default now(),
  primary key(user_id,module_no)
);

create table if not exists public.advanced_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  module_no smallint not null check(module_no between 0 and 5), -- 0 = prova geral
  score smallint not null check(score>=0 and score<=total),
  total smallint not null check((module_no=0 and total=15) or (module_no between 1 and 5 and total=5)),
  concept_results jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  constraint concept_results_array check (jsonb_typeof(concept_results)='array')
);

create index if not exists advanced_attempts_user_date_idx
  on public.advanced_attempts(user_id, created_at desc);

alter table public.advanced_progress enable row level security;
alter table public.advanced_attempts enable row level security;

drop policy if exists advanced_progress_select on public.advanced_progress;
create policy advanced_progress_select on public.advanced_progress for select to authenticated
using (user_id=(select auth.uid()) or public.is_lab_guardian((select auth.uid())));
drop policy if exists advanced_progress_insert on public.advanced_progress;
create policy advanced_progress_insert on public.advanced_progress for insert to authenticated
with check (
  user_id=(select auth.uid()) and
  exists(select 1 from public.exam_attempts a
         where a.user_id=(select auth.uid()) and a.total=16 and a.score>=13)
);
drop policy if exists advanced_progress_update on public.advanced_progress;
create policy advanced_progress_update on public.advanced_progress for update to authenticated
using (user_id=(select auth.uid()))
with check (
  user_id=(select auth.uid()) and
  exists(select 1 from public.exam_attempts a
         where a.user_id=(select auth.uid()) and a.total=16 and a.score>=13)
);

drop policy if exists advanced_attempts_select on public.advanced_attempts;
create policy advanced_attempts_select on public.advanced_attempts for select to authenticated
using (user_id=(select auth.uid()) or public.is_lab_guardian((select auth.uid())));
drop policy if exists advanced_attempts_insert on public.advanced_attempts;
create policy advanced_attempts_insert on public.advanced_attempts for insert to authenticated
with check (
  user_id=(select auth.uid()) and
  exists(select 1 from public.exam_attempts a
         where a.user_id=(select auth.uid()) and a.total=16 and a.score>=13)
);

revoke all on public.advanced_progress,public.advanced_attempts from anon,authenticated;
grant select,insert,update on public.advanced_progress to authenticated;
grant select,insert on public.advanced_attempts to authenticated;
grant usage,select on sequence public.advanced_attempts_id_seq to authenticated;

commit;
-- Verificação (seus dados antigos continuam preservados):
select 'v1 avaliações' as tipo, count(*) as quantidade from public.exam_attempts
union all select 'v2 avaliações', count(*) from public.advanced_attempts;
