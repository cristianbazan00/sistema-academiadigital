

## Diagnóstico Completo das Políticas RLS por Papel

Revisei todas as tabelas, políticas RLS e o código frontend. Encontrei **2 problemas críticos** que quebram funcionalidades do facilitador, e **1 gap** que impede relatórios completos da instituição.

### Problemas Encontrados

| # | Tabela | Problema | Impacto |
|---|--------|----------|---------|
| 1 | `class_members` | Facilitador só vê **sua própria** membership (`user_id = auth.uid()`). Não consegue listar alunos da turma. | `FacilitatorClasses` não exibe alunos |
| 2 | `profiles` | Facilitador só vê **seu próprio** perfil. Não consegue ler nomes/XP dos alunos. | `FacilitatorClasses` retorna vazio nos perfis |
| 3 | `lesson_progress` | Instituição não tem policy de leitura. | `InstitutionReports` não conseguirá calcular conclusão real |

### O que está OK

- **Admin Master**: Tem `ALL` em todas as tabelas relevantes — OK
- **Instituição**: `classes`, `class_members`, `profiles` com isolamento por `institution_id` — OK
- **Aluno**: Lê próprio progresso, memberships, trilhas publicadas — OK
- **Conteúdo educacional** (`trails`, `modules`, `lessons`, `lesson_steps`, `activities`): Admin Master gerencia, todos autenticados leem (publicados) — OK
- **`extra_activities`**: Facilitador gerencia as suas, aluno vê as da turma — OK

### Ausência de Foreign Keys

Nenhuma tabela tem FK constraints no banco. Isso não bloqueia funcionalidade (o código usa IDs corretos), mas reduz a integridade referencial. Recomendo adicionar FKs nas relações principais, mas isso pode ser feito separadamente.

---

## Solução — Migration SQL

### 1. Facilitador lê membros das suas turmas (`class_members`)

```sql
CREATE POLICY "Facilitator reads class members"
ON public.class_members
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'facilitator'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.class_members cm
    WHERE cm.class_id = class_members.class_id
      AND cm.user_id = auth.uid()
      AND cm.role = 'facilitator'::app_role
  )
);
```

Nota: isso usa `class_members` na própria policy, mas como é `SECURITY DEFINER`-free e a policy "Users see own memberships" já garante que o `cm.user_id = auth.uid()` resolve sem recursão (o Postgres avalia a subquery com a row do próprio usuário que já é visível), não há recursão. Porém, para segurança, usaremos uma função `SECURITY DEFINER`.

```sql
CREATE OR REPLACE FUNCTION public.is_facilitator_of_class(_class_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.class_members
    WHERE class_id = _class_id AND user_id = _user_id AND role = 'facilitator'::app_role
  )
$$;
```

Policy:
```sql
CREATE POLICY "Facilitator reads class members"
ON public.class_members FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'facilitator'::app_role)
  AND is_facilitator_of_class(class_id, auth.uid())
);
```

### 2. Facilitador lê perfis dos alunos das suas turmas (`profiles`)

```sql
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
```

Esta policy não causa recursão porque `profiles` não é referenciada dentro da subquery.

### 3. Instituição lê progresso dos alunos (`lesson_progress`)

```sql
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
```

### Resumo dos arquivos

| Arquivo | Ação |
|---|---|
| Nova migration SQL | Criar função `is_facilitator_of_class` + 3 novas policies RLS |
| Nenhum arquivo frontend | As queries já estão corretas; só faltavam as permissões |

