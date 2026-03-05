create or replace function public.get_event_survey_by_qr(p_qr_code text)
returns table (
  status text,
  event_id uuid,
  course_name text,
  survey_name text,
  expires_at timestamptz,
  questions jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event public.class_events%rowtype;
  v_course_name text;
  v_survey_name text;
  v_questions jsonb;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  select *
  into v_event
  from public.class_events ce
  where ce.qr_code = p_qr_code
  limit 1;

  if not found then
    return query
    select 'invalid_qr'::text, null::uuid, null::text, null::text, null::timestamptz, null::jsonb;
    return;
  end if;

  if v_event.status in ('cancelled', 'expired') or v_event.expires_at <= now() then
    return query
    select 'expired'::text, null::uuid, null::text, null::text, null::timestamptz, null::jsonb;
    return;
  end if;

  if not exists (
    select 1
    from public.course_enrollments ce
    where ce.course_id = v_event.course_id
      and ce.student_id = auth.uid()
  ) then
    return query
    select 'not_enrolled'::text, null::uuid, null::text, null::text, null::timestamptz, null::jsonb;
    return;
  end if;

  if exists (
    select 1
    from public.response_receipts rr
    where rr.event_id = v_event.id
      and rr.student_id = auth.uid()
  ) then
    return query
    select 'already_submitted'::text, v_event.id, null::text, null::text, v_event.expires_at, null::jsonb;
    return;
  end if;

  select c.name, sc.name
  into v_course_name, v_survey_name
  from public.courses c
  join public.survey_configs sc on sc.id = v_event.survey_config_id
  where c.id = v_event.course_id;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', q.id,
        'text', q.text,
        'type', q.type,
        'required', q.required,
        'likert_scale', q.likert_scale,
        'options', q.options,
        'position', ceq.position
      )
      order by ceq.position
    ),
    '[]'::jsonb
  )
  into v_questions
  from public.class_event_questions ceq
  join public.questions q on q.id = ceq.question_id
  where ceq.event_id = v_event.id;

  return query
  select 'ok'::text, v_event.id, v_course_name, v_survey_name, v_event.expires_at, v_questions;
end;
$$;

revoke all on function public.get_event_survey_by_qr(text) from public;
grant execute on function public.get_event_survey_by_qr(text) to authenticated;
