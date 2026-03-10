
CREATE OR REPLACE FUNCTION public.get_email_by_cpf(_cpf text)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT au.email
  FROM public.profiles p
  JOIN auth.users au ON au.id = p.id
  WHERE p.cpf = _cpf
  LIMIT 1
$$;
