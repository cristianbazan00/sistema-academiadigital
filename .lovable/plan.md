

## Agendamento de Liberação de Aulas por Turma

### Conceito
Criar uma tabela `class_lesson_schedules` que vincula turma + aula a uma data de liberação. A instituição define quando cada aula fica disponível para os alunos daquela turma. Aulas sem agendamento ficam disponíveis imediatamente (comportamento atual preservado).

### Alterações

**1. Migração SQL — Nova tabela `class_lesson_schedules`**

```sql
CREATE TABLE public.class_lesson_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  release_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (class_id, lesson_id)
);

ALTER TABLE class_lesson_schedules ENABLE ROW LEVEL SECURITY;

-- Instituição gerencia agendamentos das suas turmas
CREATE POLICY "Admin institution manages schedules"
ON class_lesson_schedules FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin_institution') AND get_class_institution_id(class_id) = get_user_institution_id(auth.uid()))
WITH CHECK (has_role(auth.uid(), 'admin_institution') AND get_class_institution_id(class_id) = get_user_institution_id(auth.uid()));

-- Admin master acesso total
CREATE POLICY "Admin master manages schedules"
ON class_lesson_schedules FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin_master'))
WITH CHECK (has_role(auth.uid(), 'admin_master'));

-- Alunos e facilitadores leem agendamentos das suas turmas
CREATE POLICY "Members read class schedules"
ON class_lesson_schedules FOR SELECT TO authenticated
USING (is_class_member(class_id, auth.uid()));
```

**2. Nova página/dialog: `LessonScheduleDialog`**
- Aberto a partir da tela de Turmas da instituição (novo botão "Agenda" ao lado de cada turma que tenha trilha)
- Lista todos os módulos e aulas da trilha da turma
- Para cada aula, um DatePicker para definir a data de liberação
- Salvar faz upsert em `class_lesson_schedules`
- Se a data for removida, deleta o registro (aula fica liberada imediatamente)

**3. Editar `StudentTrail.tsx` — Respeitar agendamento**
- Após carregar as aulas, buscar `class_lesson_schedules` para o `class_id` do aluno
- Uma aula com `release_date` no futuro fica bloqueada (ícone de cadeado + texto "Disponível em DD/MM")
- Alterar `isLessonAvailable` para considerar: `release_date <= hoje` AND aula anterior concluída

**4. Editar `InstitutionClasses.tsx` — Botão de Agenda**
- Adicionar botão com ícone CalendarDays em cada turma que tenha trilha vinculada
- Abre o `LessonScheduleDialog`

### Arquivos

| Arquivo | Ação |
|---------|------|
| Migração SQL | Criar tabela `class_lesson_schedules` + RLS |
| `src/components/institution/LessonScheduleDialog.tsx` | Novo — dialog de agendamento |
| `src/pages/institution/InstitutionClasses.tsx` | Adicionar botão "Agenda" |
| `src/pages/student/StudentTrail.tsx` | Filtrar aulas por `release_date` |

