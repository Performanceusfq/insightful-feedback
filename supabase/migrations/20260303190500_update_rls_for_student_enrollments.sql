alter table public.course_enrollments enable row level security;

drop policy if exists course_enrollments_select_self_or_scope on public.course_enrollments;
create policy course_enrollments_select_self_or_scope
on public.course_enrollments
for select
using (
  student_id = auth.uid()
  or public.has_role('admin')
  or public.has_role('coordinador')
  or public.has_role('director')
  or public.can_manage_course(course_id)
);

drop policy if exists course_enrollments_manage_admin on public.course_enrollments;
create policy course_enrollments_manage_admin
on public.course_enrollments
for all
using (public.has_role('admin'))
with check (public.has_role('admin'));

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
    and exists (
      select 1
      from public.course_enrollments ce
      where ce.course_id = class_events.course_id
        and ce.student_id = auth.uid()
    )
  )
);

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
    join public.course_enrollments ce2 on ce2.course_id = ce.course_id
    where ce.id = class_event_questions.event_id
      and public.has_role('estudiante')
      and ce.status = 'active'
      and ce.expires_at > now()
      and ce2.student_id = auth.uid()
  )
);
