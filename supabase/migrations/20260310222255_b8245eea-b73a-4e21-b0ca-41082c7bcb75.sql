
-- 1. Helper function to check if user is facilitator of a class (SECURITY DEFINER to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.is_facilitator_of_class(_class_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.class_members
    WHERE class_id = _class_id AND user_id = _user_id AND role = 'facilitator'::app_role
  )
$$;

-- 2. Facilitator can read all members of classes they facilitate
CREATE POLICY "Facilitator reads class members"
ON public.class_members FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'facilitator'::app_role)
  AND is_facilitator_of_class(class_id, auth.uid())
);

-- 3. Facilitator can read profiles of students in their classes
CREATE POLICY "Facilitator reads class student profiles"
ON public.profiles FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'facilitator'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.class_members cm1
    JOIN public.class_members cm2 ON cm1.class_id = cm2.class_id
    WHERE cm1.user_id = auth.uid()
      AND cm1.role = 'facilitator'::app_role
      AND cm2.user_id = profiles.id
  )
);

-- 4. Institution admin can read lesson progress for their institution's students
CREATE POLICY "Admin institution reads institution progress"
ON public.lesson_progress FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin_institution'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = lesson_progress.user_id
      AND profiles.institution_id = get_user_institution_id(auth.uid())
  )
);
