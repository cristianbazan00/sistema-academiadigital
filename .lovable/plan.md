

## Diagnóstico

Os network requests mostram erros **500** em múltiplas queries com a mensagem:

```
"infinite recursion detected in policy for relation \"classes\""
"infinite recursion detected in policy for relation \"class_members\""
```

### Causa Raiz: Recursão Circular nas Políticas RLS

As políticas de `classes` e `class_members` referenciam-se mutuamente:

```text
classes policy "Members see their classes"
  → SELECT FROM class_members WHERE class_members.class_id = classes.id
    → class_members policy "Admin institution manages class members"
      → SELECT classes.institution_id FROM classes WHERE classes.id = class_members.class_id
        → (volta para classes → recursão infinita)
```

Isso afeta **todas** as funcionalidades do perfil de instituição que consultam `classes` ou `class_members`:
- Dashboard da instituição (contagem de turmas e alunos) 
- Listagem de turmas (página atual)
- Relatórios
- Membros das turmas

### Funcionalidades afetadas no perfil instituição

| Página | Status | Problema |
|---|---|---|
| Dashboard (`/institution`) | Quebrada | Conta classes e class_members |
| Turmas (`/institution/classes`) | Quebrada | Lista classes, não exibe após criar |
| Relatórios (`/institution/reports`) | Quebrada | Consulta classes e class_members |
| Facilitadores (`/institution/facilitators`) | OK | Não consulta classes/class_members |
| Importação (`/institution/import`) | Parcial | Edge function usa service role (bypassa RLS), mas inserção de class_members pode falhar |

## Solução

Criar uma **migration SQL** que:

1. **Crie uma função SECURITY DEFINER** `get_class_institution_id(uuid)` que retorna o `institution_id` de uma classe sem passar por RLS
2. **Drop e recrie** a policy "Admin institution manages class members" em `class_members` usando a nova função em vez do subquery em `classes`
3. **Drop e recrie** a policy "Members see their classes" em `classes` usando uma função SECURITY DEFINER para verificar membership sem disparar RLS em `class_members`

### SQL da Migration

```sql
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
```

### Arquivos

Nenhuma alteração de código frontend necessária. Apenas a migration SQL resolve o problema.

