

## Fase 4: Dashboard Admin Master — Gestão de Instituições + Construtor de Trilhas

### O que será implementado

**1. Dashboard Admin com dados reais**
- Cards com contadores dinâmicos (total instituições, alunos ativos, trilhas criadas) via queries ao Supabase

**2. Gestão de Instituições (`/admin/institutions`)**
- Listagem com tabela: nome, slug, status (ativo/inativo), data de criação
- Dialog para criar nova instituição (nome, slug, logo_url)
- Dialog para editar instituição existente
- Toggle de ativação/desativação
- Busca/filtro por nome

**3. Construtor de Trilhas Hierárquico (`/admin/trails`)**
- Listagem de trilhas com status publicado/rascunho
- Criar/editar trilha (título, descrição, capa)
- Página de detalhes da trilha (`/admin/trails/:id`) com:
  - **Módulos**: criar, editar, reordenar, excluir
  - **Aulas** dentro de cada módulo: criar, editar, reordenar
  - **Passos** dentro de cada aula: adicionar vídeo, PDF, quiz, avaliação comportamental, material complementar
- Toggle de publicação da trilha
- Interface accordion/collapsible para navegação hierárquica

**4. Gestão de Atividades (dentro dos passos)**
- Ao criar um passo do tipo "quiz" ou "behavioral_assessment", abrir formulário para:
  - Adicionar questões (texto + opções JSON + resposta correta)
  - Vincular a atividade ao passo

### Arquivos a criar

| Arquivo | Descrição |
|---|---|
| `src/pages/admin/AdminInstitutions.tsx` | CRUD de instituições |
| `src/pages/admin/AdminTrails.tsx` | Listagem de trilhas |
| `src/pages/admin/AdminTrailEditor.tsx` | Editor hierárquico (módulos → aulas → passos) |
| `src/components/admin/InstitutionDialog.tsx` | Dialog criar/editar instituição |
| `src/components/admin/TrailDialog.tsx` | Dialog criar/editar trilha |
| `src/components/admin/ModuleSection.tsx` | Accordion de módulo com aulas |
| `src/components/admin/LessonSection.tsx` | Seção de aula com passos |
| `src/components/admin/StepEditor.tsx` | Editor de passo (vídeo/PDF/quiz) |
| `src/components/admin/QuestionEditor.tsx` | Editor de questões para atividades |

### Arquivos a modificar

| Arquivo | Mudança |
|---|---|
| `src/App.tsx` | Adicionar rotas `/admin/institutions`, `/admin/trails`, `/admin/trails/:id` |
| `src/pages/admin/AdminDashboard.tsx` | Buscar dados reais do Supabase para os cards |

### Sem alterações de schema
Todas as tabelas necessárias já existem (`institutions`, `trails`, `modules`, `lessons`, `lesson_steps`, `activities`, `activity_questions`). RLS já está configurado. Não há necessidade de migrações.

