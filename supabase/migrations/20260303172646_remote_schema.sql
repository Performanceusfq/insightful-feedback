create extension if not exists pgcrypto with schema extensions;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('estudiante', 'profesor', 'admin', 'coordinador', 'director');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'question_type') then
    create type public.question_type as enum ('likert', 'open', 'multiple_choice');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'question_category') then
    create type public.question_category as enum ('pedagogia', 'contenido', 'evaluacion', 'comunicacion', 'general');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'event_frequency') then
    create type public.event_frequency as enum ('per_class', 'weekly', 'biweekly', 'monthly', 'manual');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'event_status') then
    create type public.event_status as enum ('scheduled', 'active', 'expired', 'cancelled');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'event_question_source') then
    create type public.event_question_source as enum ('fixed', 'random');
  end if;
end $$;

create table if not exists public.departments (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null,
  code text not null unique,
  coordinator_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null,
  active_role public.app_role not null default 'estudiante',
  department_id uuid references public.departments(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'departments_coordinator_id_fkey'
  ) then
    alter table public.departments
      add constraint departments_coordinator_id_fkey
      foreign key (coordinator_id) references public.profiles(id) on delete set null;
  end if;
end $$;

create table if not exists public.user_roles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create table if not exists public.professors (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  department_id uuid not null references public.departments(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.courses (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null,
  code text not null,
  semester text not null,
  department_id uuid not null references public.departments(id) on delete restrict,
  professor_id uuid not null references public.professors(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (code, semester)
);

create table if not exists public.questions (
  id uuid primary key default extensions.gen_random_uuid(),
  text text not null,
  type public.question_type not null,
  category public.question_category not null,
  options jsonb,
  likert_scale int,
  required boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint questions_multiple_choice_options_chk
    check (
      (type = 'multiple_choice' and options is not null and jsonb_typeof(options) = 'array' and jsonb_array_length(options) > 0)
      or (type <> 'multiple_choice' and options is null)
    ),
  constraint questions_likert_scale_chk
    check (
      (type = 'likert' and likert_scale between 2 and 10)
      or (type <> 'likert' and likert_scale is null)
    )
);

create table if not exists public.survey_configs (
  id uuid primary key default extensions.gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  name text not null,
  random_count int not null default 0 check (random_count >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.survey_fixed_questions (
  survey_config_id uuid not null references public.survey_configs(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  position int not null check (position > 0),
  created_at timestamptz not null default now(),
  primary key (survey_config_id, question_id),
  unique (survey_config_id, position)
);

create table if not exists public.survey_random_questions (
  survey_config_id uuid not null references public.survey_configs(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (survey_config_id, question_id)
);

create table if not exists public.event_configs (
  id uuid primary key default extensions.gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  survey_config_id uuid not null references public.survey_configs(id) on delete restrict,
  frequency public.event_frequency not null,
  expiration_minutes int not null check (expiration_minutes > 0 and expiration_minutes <= 240),
  scheduled_days int[] not null default '{}',
  scheduled_time time not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_configs_scheduled_days_chk
    check (scheduled_days <@ array[0,1,2,3,4,5,6]::int[])
);

create table if not exists public.class_events (
  id uuid primary key default extensions.gen_random_uuid(),
  event_config_id uuid not null references public.event_configs(id) on delete restrict,
  course_id uuid not null references public.courses(id) on delete restrict,
  survey_config_id uuid not null references public.survey_configs(id) on delete restrict,
  qr_code text not null unique,
  status public.event_status not null default 'scheduled',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  constraint class_events_expiry_chk check (expires_at > created_at)
);

create table if not exists public.class_event_questions (
  event_id uuid not null references public.class_events(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete restrict,
  source public.event_question_source not null,
  position int not null check (position > 0),
  created_at timestamptz not null default now(),
  primary key (event_id, question_id),
  unique (event_id, position)
);

create table if not exists public.responses (
  id uuid primary key default extensions.gen_random_uuid(),
  event_id uuid not null references public.class_events(id) on delete cascade,
  answers jsonb not null,
  submitted_at timestamptz not null default now(),
  constraint responses_answers_object_chk check (jsonb_typeof(answers) = 'object')
);

create table if not exists public.response_receipts (
  event_id uuid not null references public.class_events(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  submitted_at timestamptz not null default now(),
  primary key (event_id, student_id)
);

create index if not exists idx_profiles_department_id on public.profiles(department_id);
create index if not exists idx_profiles_active_role on public.profiles(active_role);
create index if not exists idx_user_roles_user_id on public.user_roles(user_id);
create index if not exists idx_user_roles_role on public.user_roles(role);
create index if not exists idx_professors_department_id on public.professors(department_id);
create index if not exists idx_courses_department_id on public.courses(department_id);
create index if not exists idx_courses_professor_id on public.courses(professor_id);
create index if not exists idx_survey_configs_course_id on public.survey_configs(course_id);
create index if not exists idx_survey_fixed_questions_question_id on public.survey_fixed_questions(question_id);
create index if not exists idx_survey_random_questions_question_id on public.survey_random_questions(question_id);
create index if not exists idx_event_configs_course_id on public.event_configs(course_id);
create index if not exists idx_class_events_qr_code on public.class_events(qr_code);
create index if not exists idx_class_events_course_id on public.class_events(course_id);
create index if not exists idx_class_events_status_expires on public.class_events(status, expires_at);
create index if not exists idx_class_event_questions_event_id on public.class_event_questions(event_id);
create index if not exists idx_responses_event_id on public.responses(event_id);
create index if not exists idx_response_receipts_student_id on public.response_receipts(student_id);
