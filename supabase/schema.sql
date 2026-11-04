-- Supabase classroom schema (decision: classrooms + invites).
-- Run in Supabase SQL editor. App wiring (client + invites UI) follows
-- once SUPABASE_URL / SUPABASE_ANON_KEY are set.

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('teacher','student','parent')),
  display_name text not null default '',
  created_at timestamptz default now()
);

create table if not exists classrooms (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  code text not null unique, -- invite code, e.g. FOX-4821 (generated app-side)
  created_at timestamptz default now()
);

create table if not exists memberships (
  classroom_id uuid not null references classrooms(id) on delete cascade,
  student_id uuid not null references profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (classroom_id, student_id)
);

create table if not exists assignments (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references classrooms(id) on delete cascade,
  kind text not null check (kind in ('lesson','guide','activity')),
  title text not null,
  payload jsonb not null default '{}', -- rouletteId / topicId / activityId + options
  created_at timestamptz default now()
);

create table if not exists progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id) on delete cascade,
  classroom_id uuid not null references classrooms(id) on delete cascade,
  ref text not null,          -- e.g. 'lesson:debounce' / 'guide:sorting-searching'
  xp int not null default 0,
  detail jsonb not null default '{}', -- quiz scores, parsons done, etc.
  updated_at timestamptz default now(),
  unique (student_id, classroom_id, ref)
);

alter table profiles enable row level security;
alter table classrooms enable row level security;
alter table memberships enable row level security;
alter table assignments enable row level security;
alter table progress enable row level security;

-- Teachers manage their own classrooms; members read theirs.
create policy "teachers own classrooms" on classrooms
  for all using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);
create policy "members read classroom" on classrooms
  for select using (
    exists (select 1 from memberships m
      where m.classroom_id = classrooms.id and m.student_id = auth.uid())
  );

create policy "self profile" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "member read memberships" on memberships
  for select using (
    student_id = auth.uid()
    or exists (select 1 from classrooms c
      where c.id = memberships.classroom_id and c.teacher_id = auth.uid())
  );
-- No direct INSERT policy: joins go through join_classroom() so the invite
-- code is always verified. (Finding supabase-invite-code-unenforced-join:
-- the previous open INSERT checked only student identity, never the code.)

create or replace function join_classroom(p_code text)
returns uuid
language sql
security definer
set search_path = public
as $$
  insert into memberships (classroom_id, student_id)
  select id, auth.uid() from classrooms where code = p_code
  returning classroom_id;
$$;

-- Tighten function security: fixed search_path above; revoke public execute,
-- grant to authenticated users only.
revoke all on function join_classroom(text) from public;
grant execute on function join_classroom(text) to authenticated;

create policy "class visible assignments" on assignments
  for select using (
    exists (select 1 from classrooms c
      where c.id = assignments.classroom_id
      and (c.teacher_id = auth.uid()
        or exists (select 1 from memberships m
          where m.classroom_id = c.id and m.student_id = auth.uid())))
  );
create policy "teacher writes assignments" on assignments
  for all using (
    exists (select 1 from classrooms c
      where c.id = assignments.classroom_id and c.teacher_id = auth.uid())
  ) with check (
    exists (select 1 from classrooms c
      where c.id = assignments.classroom_id and c.teacher_id = auth.uid())
  );

-- Finding supabase-progress-unconstrained-self-write: the old FOR ALL policy
-- constrained only student identity, letting students forge xp/ref for any
-- classroom. Writes now require membership plus sane ranges; teachers read
-- but never write through this path; no DELETE (teacher-mediated correction
-- goes through a future RPC, not direct deletes).
create policy "progress readable" on progress
  for select using (
    student_id = auth.uid()
    or exists (select 1 from classrooms c
      where c.id = progress.classroom_id and c.teacher_id = auth.uid())
  );
create policy "progress member insert" on progress
  for insert with check (
    student_id = auth.uid()
    and exists (select 1 from memberships m
      where m.classroom_id = progress.classroom_id and m.student_id = auth.uid())
    and xp between 0 and 1000
  );
create policy "progress member update" on progress
  for update using (
    student_id = auth.uid()
    and exists (select 1 from memberships m
      where m.classroom_id = progress.classroom_id and m.student_id = auth.uid())
  ) with check (
    student_id = auth.uid()
    and exists (select 1 from memberships m
      where m.classroom_id = progress.classroom_id and m.student_id = auth.uid())
    and xp between 0 and 1000
  );

-- Primer learner model (one row per learner): skill mastery, misconception
-- log, narrative elements, interests, last-session callback. Read by every
-- generation call via a <=300-token summary; written by recordOutcome.
create table if not exists learner_models (
  user_id uuid primary key references profiles(id) on delete cascade,
  mastery jsonb not null default '{}',
  misconceptions jsonb not null default '[]',
  narrative jsonb not null default '{}',
  interests text[] not null default '{}',
  last_session jsonb not null default '{}',
  updated_at timestamptz default now()
);

alter table learner_models enable row level security;

create policy "own learner model" on learner_models
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "teacher reads learner model" on learner_models
  for select using (
    exists (select 1 from memberships m
      join classrooms c on c.id = m.classroom_id
      where m.student_id = learner_models.user_id
        and c.teacher_id = auth.uid())
  );
