-- LABORATÓRIO DA ÁGUA — Supabase PostgreSQL
-- 1) Rode este script no SQL Editor do seu projeto Supabase.
-- 2) Crie 7 contas em Authentication > Users usando os logins do README.
-- 3) Rode o bloco de cadastro de perfis ao final deste arquivo.
-- Os dados ficam privados; somente responsáveis autenticados têm visão coletiva.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  role text not null check (role in ('student','guardian')),
  created_at timestamptz not null default now()
);

create table if not exists public.module_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  module_no smallint not null check (module_no between 1 and 5),
  completed_at timestamptz not null default now(),
  primary key(user_id,module_no)
);

create table if not exists public.exam_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  score smallint not null check (score >= 0 and score <= total),
  total smallint not null check (total > 0 and total <= 50),
  created_at timestamptz not null default now()
);

create index if not exists exam_attempts_user_date_idx
  on public.exam_attempts (user_id, created_at desc);

-- O papel 'guardian' só pode ser definido pelo administrador do Supabase,
-- não pelo navegador. A função SECURITY DEFINER é usada somente para
-- consultar o papel, evitando recursão das políticas da tabela profiles.
create or replace function public.is_lab_guardian(p_uid uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists(
    select 1 from public.profiles
    where id = p_uid and role = 'guardian'
  );
$$;
revoke all on function public.is_lab_guardian(uuid) from public;
grant execute on function public.is_lab_guardian(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.module_progress enable row level security;
alter table public.exam_attempts enable row level security;

-- Proteção reforçada: somente perfis explícitos e autenticados.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
using (id = (select auth.uid()) or public.is_lab_guardian((select auth.uid())));

-- Criação/alteração de roles NÃO é permitida pela aplicação. Apenas pelo
-- editor SQL / dashboard administrativo do projeto, fora do navegador.

drop policy if exists progress_select on public.module_progress;
create policy progress_select on public.module_progress for select to authenticated
using (user_id = (select auth.uid()) or public.is_lab_guardian((select auth.uid())));
drop policy if exists progress_insert on public.module_progress;
create policy progress_insert on public.module_progress for insert to authenticated
with check (user_id = (select auth.uid()));
drop policy if exists progress_update on public.module_progress;
create policy progress_update on public.module_progress for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists attempts_select on public.exam_attempts;
create policy attempts_select on public.exam_attempts for select to authenticated
using (user_id = (select auth.uid()) or public.is_lab_guardian((select auth.uid())));
drop policy if exists attempts_insert on public.exam_attempts;
create policy attempts_insert on public.exam_attempts for insert to authenticated
with check (user_id = (select auth.uid()));

-- Revogue permissões amplas herdadas e permita apenas as operações necessárias.
revoke all on public.profiles, public.module_progress, public.exam_attempts from anon, authenticated;
grant usage on schema public to authenticated;
grant select on public.profiles to authenticated;
grant select, insert, update on public.module_progress to authenticated;
grant select, insert on public.exam_attempts to authenticated;
grant usage, select on sequence public.exam_attempts_id_seq to authenticated;

-- PASSO FINAL (APÓS CRIAR AS CONTAS EM AUTHENTICATION > USERS):
-- Rode as instruções abaixo. Substitua os dois e-mails de responsáveis
-- e os nomes exibidos que preferir. Não use nome completo de crianças.

-- Cinco alunos. Os nomes e e-mails devem coincidir com o formulário de login.
insert into public.profiles(id,display_name,role)
select u.id,
  case u.email
    when 'icaro@alunos.example' then 'Ícaro'
    when 'theo@alunos.example' then 'Théo'
    when 'heitor@alunos.example' then 'Heitor'
    when 'miguel@alunos.example' then 'Miguel'
    when 'lucas@alunos.example' then 'Lucas'
  end,
  'student'
from auth.users u
where u.email in ('icaro@alunos.example','theo@alunos.example','heitor@alunos.example','miguel@alunos.example','lucas@alunos.example')
on conflict(id) do update set display_name=excluded.display_name,role=excluded.role;

-- Após criar as duas contas adultas com e-mails reais, execute, ajustando:
-- insert into public.profiles(id,display_name,role)
-- select id,'Pai · teste','guardian' from auth.users
-- where email='SEU_EMAIL_REAL@EXEMPLO.COM'
-- on conflict(id) do update set display_name=excluded.display_name, role=excluded.role;
-- insert into public.profiles(id,display_name,role)
-- select id,'Mãe · teste','guardian' from auth.users
-- where email='EMAIL_REAL_DA_MAE@EXEMPLO.COM'
-- on conflict(id) do update set display_name=excluded.display_name, role=excluded.role;

-- VERIFICAÇÃO: resultado esperado: cinco alunos + dois responsáveis.
select display_name,role from public.profiles order by role,display_name;
