CREATE TABLE public.class_lesson_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  release_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (class_id, lesson_id)
);

ALTER TABLE class_lesson_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin institution manages schedules"
ON class_lesson_schedules FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin_institution'::app_role) AND get_class_institution_id(class_id) = get_user_institution_id(auth.uid()))
WITH CHECK (has_role(auth.uid(), 'admin_institution'::app_role) AND get_class_institution_id(class_id) = get_user_institution_id(auth.uid()));

CREATE POLICY "Admin master manages schedules"
ON class_lesson_schedules FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin_master'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin_master'::app_role));

CREATE POLICY "Members read class schedules"
ON class_lesson_schedules FOR SELECT TO authenticated
USING (is_class_member(class_id, auth.uid()));