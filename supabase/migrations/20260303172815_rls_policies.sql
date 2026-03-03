alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.departments enable row level security;
alter table public.professors enable row level security;
alter table public.courses enable row level security;
alter table public.questions enable row level security;
alter table public.survey_configs enable row level security;
alter table public.survey_fixed_questions enable row level security;
alter table public.survey_random_questions enable row level security;
alter table public.event_configs enable row level security;
alter table public.class_events enable row level security;
alter table public.class_event_questions enable row level security;
alter table public.responses enable row level security;
alter table public.response_receipts enable row level security;

drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self
on public.profiles
for select
using (id = auth.uid());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self
on public.profiles
for update
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists profiles_manage_admin on public.profiles;
create policy profiles_manage_admin
on public.profiles
for all
using (public.has_role('admin'))
with check (public.has_role('admin'));

drop policy if exists user_roles_select_own_or_admin on public.user_roles;
create policy user_roles_select_own_or_admin
on public.user_roles
for select
using (user_id = auth.uid() or public.has_role('admin'));

drop policy if exists user_roles_manage_admin on public.user_roles;
create policy user_roles_manage_admin
on public.user_roles
for all
using (public.has_role('admin'))
with check (public.has_role('admin'));

drop policy if exists departments_select_authenticated on public.departments;
create policy departments_select_authenticated
on public.departments
for select
using (auth.uid() is not null);

drop policy if exists departments_manage_admin on public.departments;
create policy departments_manage_admin
on public.departments
for all
using (public.has_role('admin'))
with check (public.has_role('admin'));

drop policy if exists professors_select_authenticated on public.professors;
create policy professors_select_authenticated
on public.professors
for select
using (auth.uid() is not null);

drop policy if exists professors_manage_admin on public.professors;
create policy professors_manage_admin
on public.professors
for all
using (public.has_role('admin'))
with check (public.has_role('admin'));

drop policy if exists courses_select_authenticated on public.courses;
create policy courses_select_authenticated
on public.courses
for select
using (auth.uid() is not null);

drop policy if exists courses_manage_admin on public.courses;
create policy courses_manage_admin
on public.courses
for all
using (public.has_role('admin'))
with check (public.has_role('admin'));

drop policy if exists questions_select_authenticated on public.questions;
create policy questions_select_authenticated
on public.questions
for select
using (auth.uid() is not null);

drop policy if exists questions_manage_admin on public.questions;
create policy questions_manage_admin
on public.questions
for all
using (public.has_role('admin'))
with check (public.has_role('admin'));

drop policy if exists survey_configs_select_authenticated on public.survey_configs;
create policy survey_configs_select_authenticated
on public.survey_configs
for select
using (auth.uid() is not null);

drop policy if exists survey_configs_manage_admin on public.survey_configs;
create policy survey_configs_manage_admin
on public.survey_configs
for all
using (public.has_role('admin'))
with check (public.has_role('admin'));

drop policy if exists survey_fixed_questions_select_authenticated on public.survey_fixed_questions;
create policy survey_fixed_questions_select_authenticated
on public.survey_fixed_questions
for select
using (auth.uid() is not null);

drop policy if exists survey_fixed_questions_manage_admin on public.survey_fixed_questions;
create policy survey_fixed_questions_manage_admin
on public.survey_fixed_questions
for all
using (public.has_role('admin'))
with check (public.has_role('admin'));

drop policy if exists survey_random_questions_select_authenticated on public.survey_random_questions;
create policy survey_random_questions_select_authenticated
on public.survey_random_questions
for select
using (auth.uid() is not null);

drop policy if exists survey_random_questions_manage_admin on public.survey_random_questions;
create policy survey_random_questions_manage_admin
on public.survey_random_questions
for all
using (public.has_role('admin'))
with check (public.has_role('admin'));

drop policy if exists event_configs_select_authenticated on public.event_configs;
create policy event_configs_select_authenticated
on public.event_configs
for select
using (auth.uid() is not null);

drop policy if exists event_configs_manage_course on public.event_configs;
create policy event_configs_manage_course
on public.event_configs
for all
using (public.has_role('admin') or public.can_manage_course(course_id))
with check (public.has_role('admin') or public.can_manage_course(course_id));

drop policy if exists class_events_select_by_role on public.class_events;
create policy class_events_select_by_role
on public.class_events
for select
using (
  public.has_role('admin')
  or public.has_role('coordinador')
  or public.has_role('director')
  or public.can_manage_course(course_id)
  or (
    public.has_role('estudiante')
    and status = 'active'
    and expires_at > now()
  )
);

drop policy if exists class_events_manage_course on public.class_events;
create policy class_events_manage_course
on public.class_events
for all
using (public.has_role('admin') or public.can_manage_course(course_id))
with check (public.has_role('admin') or public.can_manage_course(course_id));

drop policy if exists class_event_questions_select_by_role on public.class_event_questions;
create policy class_event_questions_select_by_role
on public.class_event_questions
for select
using (
  public.has_role('admin')
  or public.has_role('coordinador')
  or public.has_role('director')
  or exists (
    select 1
    from public.class_events ce
    where ce.id = class_event_questions.event_id
      and public.can_manage_course(ce.course_id)
  )
  or exists (
    select 1
    from public.class_events ce
    where ce.id = class_event_questions.event_id
      and public.has_role('estudiante')
      and ce.status = 'active'
      and ce.expires_at > now()
  )
);

drop policy if exists class_event_questions_manage_course on public.class_event_questions;
create policy class_event_questions_manage_course
on public.class_event_questions
for all
using (
  public.has_role('admin')
  or exists (
    select 1
    from public.class_events ce
    where ce.id = class_event_questions.event_id
      and public.can_manage_course(ce.course_id)
  )
)
with check (
  public.has_role('admin')
  or exists (
    select 1
    from public.class_events ce
    where ce.id = class_event_questions.event_id
      and public.can_manage_course(ce.course_id)
  )
);

drop policy if exists responses_select_by_scope on public.responses;
create policy responses_select_by_scope
on public.responses
for select
using (
  public.has_role('admin')
  or public.has_role('coordinador')
  or public.has_role('director')
  or exists (
    select 1
    from public.class_events ce
    where ce.id = responses.event_id
      and public.can_manage_course(ce.course_id)
  )
);

drop policy if exists response_receipts_select_scope on public.response_receipts;
create policy response_receipts_select_scope
on public.response_receipts
for select
using (
  student_id = auth.uid()
  or public.has_role('admin')
  or public.has_role('coordinador')
  or public.has_role('director')
  or exists (
    select 1
    from public.class_events ce
    where ce.id = response_receipts.event_id
      and public.can_manage_course(ce.course_id)
  )
);
