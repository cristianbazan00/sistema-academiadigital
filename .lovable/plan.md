

## Edição e Visualização de Conteúdo para Admin Master

### Problema Atual
Os componentes `StepEditor`, `LessonSection` e `QuestionEditor` só permitem **criar** e **excluir** — não há como **visualizar o conteúdo completo** nem **editar** itens existentes.

### Alterações

**1. `LessonSection.tsx` — Editar título da aula**
- Adicionar botão de edição (ícone Pencil) ao lado do título da aula
- Ao clicar, substituir o título por um Input inline editável
- Salvar com Enter ou botão, cancelar com Escape
- Update via `supabase.from("lessons").update({ title }).eq("id", id)`

**2. `StepEditor.tsx` — Visualizar e editar passos**
- **Visualização**: Expandir o card de cada passo para mostrar `content_body` (renderizado como HTML para supplementary) e `content_url` completo (não truncado)
- **Edição**: Adicionar botão Pencil em cada passo que abre um formulário inline (ou colapsa/expande) com campos editáveis:
  - Título, URL do conteúdo, Conteúdo (textarea para content_body)
  - Salvar via `supabase.from("lesson_steps").update({...}).eq("id", step.id)`
- Usar estado `editingStepId` para controlar qual passo está em modo de edição

**3. `QuestionEditor.tsx` — Editar questões existentes**
- Adicionar botão Pencil em cada questão
- Ao clicar, transformar o card em formulário editável (mesmos campos do formulário de criação, preenchidos com valores atuais)
- Salvar via `supabase.from("activity_questions").update({...}).eq("id", q.id)`
- Estado `editingQuestionId` para controlar qual questão está em modo de edição

### Resumo dos Arquivos

| Arquivo | Mudança |
|---------|---------|
| `src/components/admin/LessonSection.tsx` | Adicionar edição inline do título da aula |
| `src/components/admin/StepEditor.tsx` | Mostrar conteúdo completo + formulário de edição inline |
| `src/components/admin/QuestionEditor.tsx` | Formulário de edição inline para questões |

Nenhuma alteração de banco de dados necessária — as políticas RLS já permitem que `admin_master` faça UPDATE em todas as tabelas envolvidas.

