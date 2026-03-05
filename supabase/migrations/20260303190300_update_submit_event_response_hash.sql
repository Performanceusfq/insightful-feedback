create or replace function public.submit_event_response(p_qr_code text, p_answers jsonb)
returns table (
  status text,
  response_id uuid,
  submitted_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event public.class_events%rowtype;
  v_receipt_submitted_at timestamptz;
  v_response_id uuid;
  v_response_submitted_at timestamptz;
  v_semester text;
  v_key_id smallint;
  v_pepper text;
  v_hash_payload text;
  v_respondent_hash text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  if p_answers is null or jsonb_typeof(p_answers) <> 'object' then
    raise exception 'Answers payload must be a JSON object';
  end if;

  select *
  into v_event
  from public.class_events ce
  where ce.qr_code = p_qr_code
  limit 1;

  if not found then
    return query
    select 'invalid_qr'::text, null::uuid, null::timestamptz;
    return;
  end if;

  if v_event.status in ('cancelled', 'expired') or v_event.expires_at <= now() then
    return query
    select 'expired'::text, null::uuid, null::timestamptz;
    return;
  end if;

  if not exists (
    select 1
    from public.course_enrollments ce
    where ce.course_id = v_event.course_id
      and ce.student_id = auth.uid()
  ) then
    -- Keep function contract unchanged to avoid leaking enrollment/event visibility.
    return query
    select 'invalid_qr'::text, null::uuid, null::timestamptz;
    return;
  end if;

  insert into public.response_receipts (event_id, student_id)
  values (v_event.id, auth.uid())
  on conflict (event_id, student_id) do nothing
  returning submitted_at into v_receipt_submitted_at;

  if v_receipt_submitted_at is null then
    return query
    select 'already_submitted'::text, null::uuid, null::timestamptz;
    return;
  end if;

  select c.semester
  into v_semester
  from public.courses c
  where c.id = v_event.course_id;

  if v_semester is null then
    raise exception 'Course semester not found for event %', v_event.id;
  end if;

  select rk.key_id, rk.pepper
  into v_key_id, v_pepper
  from app_private.respondent_hash_keys rk
  where rk.is_active = true
  order by rk.key_id desc
  limit 1;

  if v_pepper is null then
    raise exception 'No active respondent hash key configured';
  end if;

  v_hash_payload := auth.uid()::text
    || '|' || v_event.course_id::text
    || '|' || v_semester
    || '|' || v_key_id::text;

  v_respondent_hash := encode(
    extensions.hmac(
      convert_to(v_hash_payload, 'UTF8'),
      convert_to(v_pepper, 'UTF8'),
      'sha256'
    ),
    'hex'
  );

  begin
    insert into public.responses (event_id, answers, respondent_hash)
    values (v_event.id, p_answers, v_respondent_hash)
    returning id, submitted_at into v_response_id, v_response_submitted_at;
  exception
    when unique_violation then
      return query
      select 'already_submitted'::text, null::uuid, null::timestamptz;
      return;
  end;

  return query
  select 'ok'::text, v_response_id, v_response_submitted_at;
end;
$$;

revoke all on function public.submit_event_response(text, jsonb) from public;
grant execute on function public.submit_event_response(text, jsonb) to authenticated;
