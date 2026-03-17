-- Add department_id to questions table so questions can be linked to specific departments.
-- NULL department_id means the question is "General" (applies to all departments).

ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_questions_department_id ON public.questions(department_id);
