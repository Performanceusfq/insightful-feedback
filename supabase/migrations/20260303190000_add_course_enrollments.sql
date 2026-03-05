create table if not exists public.course_enrollments (
  course_id uuid not null references public.courses(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (course_id, student_id)
);

create index if not exists idx_course_enrollments_student_id
  on public.course_enrollments(student_id);

create index if not exists idx_course_enrollments_course_id
  on public.course_enrollments(course_id);
