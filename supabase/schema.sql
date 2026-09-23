-- Drop old tables to apply canonical schema cleanly
drop table if exists certificates cascade;
drop table if exists attempts cascade;
drop table if exists mcq_questions cascade;
drop table if exists ar_scenarios cascade;
drop table if exists lesson_progress cascade;
drop table if exists lesson_media cascade;
drop table if exists lessons cascade;
drop table if exists modules cascade;
drop table if exists course_categories cascade;
drop table if exists workers cascade;
drop table if exists users cascade;

-- Identity
create table users (
  id uuid primary key references auth.users(id),
  name text,
  role text check (role in ('supervisor', 'dgms')) not null,
  official_id text unique
);

create table workers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id),
  name text,
  worker_code text unique,
  site text,
  sector text,
  clearance_level int default 1,
  status text default 'active',
  joined_at timestamptz default now()
);

-- Course structure
create table course_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text,
  order_index int default 0
);

create table modules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  category_id uuid references course_categories(id),
  description text
);

create table lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid references modules(id) on delete cascade,
  order_index int not null,
  type text check (type in ('video', 'text')) not null,
  title text not null,
  video_url text,
  content text
);

create table lesson_media (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references lessons(id) on delete cascade,
  language_code text check (language_code in ('en', 'hi', 'sat')) not null,
  video_url text,
  audio_url text,
  unique (lesson_id, language_code)
);

create table lesson_progress (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid references workers(id) on delete cascade,
  lesson_id uuid references lessons(id) on delete cascade,
  completed_at timestamptz default now(),
  unique (worker_id, lesson_id)
);

create table ar_scenarios (
  id uuid primary key default gen_random_uuid(),
  module_id uuid references modules(id) on delete cascade,
  name text not null,
  unity_scene_ref text,
  steps jsonb,
  order_index int default 0
);

create table mcq_questions (
  id uuid primary key default gen_random_uuid(),
  module_id uuid references modules(id) on delete cascade,
  question text not null,
  options jsonb not null,
  correct_option int not null,
  order_index int default 0,
  feedback_correct text,
  feedback_incorrect text,
  interaction_type text default 'standard'
);

-- Progress + certification
create table attempts (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid references workers(id) on delete cascade,
  module_id uuid references modules(id) on delete cascade,
  score int,
  status text check (status in ('pass', 'fail')),
  attempt_type text check (attempt_type in ('initial', 'retake', 'final')),
  source text check (source in ('mcq', 'ar')) default 'mcq',
  ar_events jsonb,
  hash text,
  created_at timestamptz default now()
);

create table certificates (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid references workers(id) on delete cascade,
  module_id uuid references modules(id) on delete cascade,
  cert_hash text not null,
  qr_code text,
  status text default 'pending' check (status in ('pending', 'verified', 'revoked')),
  issued_at timestamptz default now(),
  verified_by uuid references users(id)
);

-- Auto-create a worker profile when someone signs up
create or replace function public.handle_new_worker()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.workers (auth_user_id, name, worker_code, site, sector, clearance_level, status, joined_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email, 'Unnamed Worker'),
    coalesce(new.raw_user_meta_data->>'worker_code', 'W-TEMP-' || substr(new.id::text, 1, 6)),
    new.raw_user_meta_data->>'site',
    new.raw_user_meta_data->>'sector',
    coalesce((new.raw_user_meta_data->>'clearance_level')::int, 1),
    'active',
    now()
  );
  return new;
exception when others then
  raise warning 'handle_new_worker failed for user %: %', new.id, sqlerrm;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_worker();

-- RLS (permissive for hackathon speed; tighten later if time allows)
alter table users enable row level security;
alter table workers enable row level security;
alter table course_categories enable row level security;
alter table modules enable row level security;
alter table lessons enable row level security;
alter table lesson_media enable row level security;
alter table lesson_progress enable row level security;
alter table ar_scenarios enable row level security;
alter table mcq_questions enable row level security;
alter table attempts enable row level security;
alter table certificates enable row level security;

create policy "read_own_user" on users for select using (auth.uid() = id);
create policy "read_all_authenticated" on workers for select using (auth.role() = 'authenticated');
create policy "worker_update_own" on workers for update using (auth.uid() = auth_user_id);
create policy "public_read" on course_categories for select using (true);
create policy "public_read" on modules for select using (true);
create policy "public_read" on lessons for select using (true);
create policy "public_read" on lesson_media for select using (true);
create policy "public_read" on ar_scenarios for select using (true);
create policy "public_read" on mcq_questions for select using (true);
create policy "worker_own_progress" on lesson_progress for all using (true) with check (true);
create policy "read_all_authenticated" on attempts for select using (auth.role() = 'authenticated');
create policy "public_insert_attempts" on attempts for insert with check (true);
create policy "read_all_authenticated" on certificates for select using (auth.role() = 'authenticated');
create policy "dgms_update_certificates" on certificates for update
  using (exists (select 1 from users where id = auth.uid() and role = 'dgms'));

-- Views for Safety Score and Modules Completed
create or replace view worker_safety_score as
select
  w.id as worker_id,
  case
    when count(best.module_id) = 0 then null
    else round(avg(best.best_score))
  end as safety_score
from workers w
left join (
  select worker_id, module_id, max(score) as best_score
  from attempts
  where source = 'mcq' and status = 'pass'
  group by worker_id, module_id
) best on best.worker_id = w.id
group by w.id;

create or replace view worker_modules_completed as
select
  w.id as worker_id,
  count(distinct a.module_id) as completed_count,
  (select count(*) from modules) as total_modules
from workers w
left join attempts a
  on a.worker_id = w.id and a.source = 'mcq' and a.status = 'pass'
group by w.id;

-- Stage progress per module: completed lessons + AR done + assessment done
create or replace view worker_module_stage_progress as
select
  w.id as worker_id,
  m.id as module_id,
  m.name as module_name,
  (select count(*) from lessons l where l.module_id = m.id) as total_lessons,
  (select count(*) from lesson_progress lp
     join lessons l on l.id = lp.lesson_id
     where lp.worker_id = w.id and l.module_id = m.id) as completed_lessons,
  case when exists (
    select 1 from attempts a
    where a.worker_id = w.id and a.module_id = m.id and a.source = 'ar' and a.status = 'pass'
  ) then 1 else 0 end as ar_done,
  case when exists (
    select 1 from attempts a
    where a.worker_id = w.id and a.module_id = m.id and a.source = 'mcq' and a.status = 'pass'
  ) then 1 else 0 end as assessment_done
from workers w
cross join modules m;

-- Progress percentage per module
create or replace view worker_module_progress_pct as
select
  worker_id,
  module_id,
  module_name,
  round(
    (completed_lessons + ar_done + assessment_done)::numeric
    / nullif(total_lessons + 2, 0) * 100
  ) as progress_pct
from worker_module_stage_progress;

-- Overall progress percentage per worker across all modules
create or replace view worker_overall_progress as
select
  worker_id,
  round(coalesce(avg(progress_pct), 0)) as overall_progress_pct
from worker_module_progress_pct
group by worker_id;

