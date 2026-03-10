-- 1. Função para obter institution_id de uma classe (bypassa RLS)
CREATE OR REPLACE FUNCTION public.get_class_institution_id(_class_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT institution_id FROM public.classes WHERE id = _class_id
$$;

-- 2. Função para verificar membership (bypassa RLS)
CREATE OR REPLACE FUNCTION public.is_class_member(_class_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.class_members
    WHERE class_id = _class_id AND user_id = _user_id
  )
$$;

-- 3. Corrigir policy de class_members
DROP POLICY IF EXISTS "Admin institution manages class members" ON public.class_members;
CREATE POLICY "Admin institution manages class members"
ON public.class_members
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin_institution'::app_role)
  AND get_class_institution_id(class_id) = get_user_institution_id(auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'admin_institution'::app_role)
  AND get_class_institution_id(class_id) = get_user_institution_id(auth.uid())
);

-- 4. Corrigir policy de classes
DROP POLICY IF EXISTS "Members see their classes" ON public.classes;
CREATE POLICY "Members see their classes"
ON public.classes
FOR SELECT
TO authenticated
USING (is_class_member(id, auth.uid()));