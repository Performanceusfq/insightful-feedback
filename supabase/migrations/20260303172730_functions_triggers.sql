create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_departments_updated_at on public.departments;
create trigger trg_departments_updated_at
before update on public.departments
for each row
execute function public.set_updated_at();

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists trg_professors_updated_at on public.professors;
create trigger trg_professors_updated_at
before update on public.professors
for each row
execute function public.set_updated_at();

drop trigger if exists trg_courses_updated_at on public.courses;
create trigger trg_courses_updated_at
before update on public.courses
for each row
execute function public.set_updated_at();

drop trigger if exists trg_questions_updated_at on public.questions;
create trigger trg_questions_updated_at
before update on public.questions
for each row
execute function public.set_updated_at();

drop trigger if exists trg_survey_configs_updated_at on public.survey_configs;
create trigger trg_survey_configs_updated_at
before update on public.survey_configs
for each row
execute function public.set_updated_at();

drop trigger if exists trg_event_configs_updated_at on public.event_configs;
create trigger trg_event_configs_updated_at
before update on public.event_configs
for each row
execute function public.set_updated_at();

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  inferred_name text;
begin
  inferred_name := coalesce(
    new.raw_user_meta_data ->> 'name',
    new.raw_user_meta_data ->> 'full_name',
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Usuario'
  );

  insert into public.profiles (id, email, name)
  values (new.id, coalesce(new.email, ''), inferred_name)
  on conflict (id) do update
    set email = excluded.email,
        name = excluded.name,
        updated_at = now();

  insert into public.user_roles (user_id, role)
  values (new.id, 'estudiante')
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.create_profile_for_new_user();

create or replace function public.has_role(p_role public.app_role)
returns boolean
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if auth.uid() is null then
    return false;
  end if;

  return exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = p_role
  );
end;
$$;

create or replace function public.can_manage_course(p_course_id uuid)
returns boolean
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if auth.uid() is null then
    return false;
  end if;

  if public.has_role('admin') then
    return true;
  end if;

  return exists (
    select 1
    from public.courses c
    join public.professors p on p.id = c.professor_id
    where c.id = p_course_id
      and p.user_id = auth.uid()
  );
end;
$$;

create or replace function public.generate_unique_qr_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  generated_code text;
begin
  loop
    generated_code := upper(encode(extensions.gen_random_bytes(6), 'hex'));
    exit when not exists (
      select 1
      from public.class_events ce
      where ce.qr_code = generated_code
    );
  end loop;

  return generated_code;
end;
$$;

create or replace function public.generate_class_event(p_course_id uuid)
returns table (
  event_id uuid,
  qr_code text,
  expires_at timestamptz,
  status public.event_status
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_config_id uuid;
  v_survey_config_id uuid;
  v_expiration_minutes int;
  v_random_count int;
  v_event_id uuid;
  v_qr_code text;
  v_expires_at timestamptz;
  v_fixed_count int;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  if not public.can_manage_course(p_course_id) then
    raise exception 'Not authorized to create events for this course' using errcode = '42501';
  end if;

  select
    ec.id,
    ec.survey_config_id,
    ec.expiration_minutes,
    sc.random_count
  into
    v_event_config_id,
    v_survey_config_id,
    v_expiration_minutes,
    v_random_count
  from public.event_configs ec
  join public.survey_configs sc on sc.id = ec.survey_config_id
  where ec.course_id = p_course_id
    and ec.active = true
  order by ec.updated_at desc, ec.created_at desc
  limit 1;

  if v_event_config_id is null then
    raise exception 'No active event_config found for this course';
  end if;

  v_qr_code := public.generate_unique_qr_code();
  v_expires_at := now() + make_interval(mins => v_expiration_minutes);

  insert into public.class_events (
    event_config_id,
    course_id,
    survey_config_id,
    qr_code,
    status,
    expires_at
  )
  values (
    v_event_config_id,
    p_course_id,
    v_survey_config_id,
    v_qr_code,
    'active',
    v_expires_at
  )
  returning id into v_event_id;

  insert into public.class_event_questions (event_id, question_id, source, position)
  select
    v_event_id,
    sfq.question_id,
    'fixed',
    sfq.position
  from public.survey_fixed_questions sfq
  where sfq.survey_config_id = v_survey_config_id
  order by sfq.position;

  select coalesce(max(sfq.position), 0)
  into v_fixed_count
  from public.survey_fixed_questions sfq
  where sfq.survey_config_id = v_survey_config_id;

  with sampled_random as (
    select
      picked.question_id,
      row_number() over () as rn
    from (
      select srq.question_id
      from public.survey_random_questions srq
      where srq.survey_config_id = v_survey_config_id
      order by random()
      limit greatest(v_random_count, 0)
    ) as picked
  )
  insert into public.class_event_questions (event_id, question_id, source, position)
  select
    v_event_id,
    sampled_random.question_id,
    'random',
    v_fixed_count + sampled_random.rn
  from sampled_random;

  return query
  select
    v_event_id,
    v_qr_code,
    v_expires_at,
    'active'::public.event_status;
end;
$$;

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

  insert into public.response_receipts (event_id, student_id)
  values (v_event.id, auth.uid())
  on conflict (event_id, student_id) do nothing
  returning submitted_at into v_receipt_submitted_at;

  if v_receipt_submitted_at is null then
    return query
    select 'already_submitted'::text, null::uuid, null::timestamptz;
    return;
  end if;

  insert into public.responses (event_id, answers)
  values (v_event.id, p_answers)
  returning id, submitted_at into v_response_id, v_response_submitted_at;

  return query
  select 'ok'::text, v_response_id, v_response_submitted_at;
end;
$$;

revoke all on function public.generate_class_event(uuid) from public;
grant execute on function public.generate_class_event(uuid) to authenticated;

revoke all on function public.submit_event_response(text, jsonb) from public;
grant execute on function public.submit_event_response(text, jsonb) to authenticated;
