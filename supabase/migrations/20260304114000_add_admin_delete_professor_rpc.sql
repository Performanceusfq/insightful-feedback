create or replace function public.admin_delete_professor(
  p_professor_id uuid,
  p_replacement_professor_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target_user_id uuid;
  v_course_count int := 0;
  v_moved_courses int := 0;
  v_deleted_rows int := 0;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  if not public.has_role('admin') then
    raise exception 'Not authorized to delete professors' using errcode = '42501';
  end if;

  if p_professor_id is null then
    raise exception 'Professor id is required' using errcode = '22023';
  end if;

  if p_replacement_professor_id = p_professor_id then
    raise exception 'Replacement professor must be different' using errcode = '22023';
  end if;

  select p.user_id
  into v_target_user_id
  from public.professors p
  where p.id = p_professor_id;

  if v_target_user_id is null then
    raise exception 'Professor not found' using errcode = 'P0002';
  end if;

  select count(*)
  into v_course_count
  from public.courses c
  where c.professor_id = p_professor_id;

  if v_course_count > 0 then
    if p_replacement_professor_id is null then
      raise exception 'Replacement professor is required when courses are assigned' using errcode = '22023';
    end if;

    perform 1
    from public.professors p
    where p.id = p_replacement_professor_id;

    if not found then
      raise exception 'Replacement professor not found' using errcode = 'P0002';
    end if;

    update public.courses
    set professor_id = p_replacement_professor_id
    where professor_id = p_professor_id;

    get diagnostics v_moved_courses = row_count;
  end if;

  delete from public.professors p
  where p.id = p_professor_id;

  get diagnostics v_deleted_rows = row_count;

  if v_deleted_rows = 0 then
    raise exception 'Professor not found' using errcode = 'P0002';
  end if;

  return jsonb_build_object(
    'deleted_professor_id', p_professor_id,
    'deleted_user_id', v_target_user_id,
    'moved_courses', v_moved_courses
  );
end;
$$;

grant execute on function public.admin_delete_professor(uuid, uuid) to authenticated;
revoke all on function public.admin_delete_professor(uuid, uuid) from anon;
