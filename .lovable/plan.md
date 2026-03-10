

## Fase 5: Dashboard Admin Instituição

### Visão Geral
Criar o painel completo para administradores de instituição, com métricas da instituição, gestão de turmas, cadastro de facilitadores, e importação em lote de alunos via CSV.

### O que será implementado

**1. Dashboard Instituição (`/institution`)**
- Cards: total de turmas, alunos ativos, facilitadores, % conclusão média
- Queries filtradas por `institution_id` do usuário logado (via `get_user_institution_id`)

**2. Gestão de Turmas (`/institution/classes`)**
- Listagem de turmas da instituição com status ativo/inativo
- Dialog para criar/editar turma (nome, descrição)
- Toggle de ativação
- Visualizar membros de cada turma (alunos + facilitadores)

**3. Gestão de Facilitadores (`/institution/facilitators`)**
- Listar facilitadores da instituição (profiles com role `facilitator` e mesmo `institution_id`)
- Cadastro de facilitador: CPF + email + nome → cria via edge function com role `facilitator` e vincula à instituição
- Alocar/desalocar facilitador em turmas

**4. Importação de Alunos via CSV (`/institution/import`)**
- Upload de arquivo CSV com colunas: `cpf`, `nome`, `turma`
- Parse client-side do CSV, validação de CPFs e exibição de preview
- Envio em lote para uma **edge function** `import-students` que:
  - Cria usuários no auth (com senha temporária ou sem senha para ativação posterior)
  - Atualiza profiles com CPF, nome e `institution_id`
  - Atribui role `student`
  - Aloca nas turmas especificadas
- Exibe resultado: criados com sucesso, já existentes, erros

**5. Relatórios da Instituição (`/institution/reports`)**
- % conclusão por turma (barra de progresso)
- Notas médias por turma
- Ranking de alunos por XP

### Arquivos a criar

| Arquivo | Descrição |
|---|---|
| `src/pages/institution/InstitutionDashboard.tsx` | Dashboard com métricas |
| `src/pages/institution/InstitutionClasses.tsx` | CRUD de turmas + membros |
| `src/pages/institution/InstitutionFacilitators.tsx` | Gestão de facilitadores |
| `src/pages/institution/InstitutionImport.tsx` | Importação CSV |
| `src/pages/institution/InstitutionReports.tsx` | Relatórios |
| `src/components/institution/ClassDialog.tsx` | Dialog criar/editar turma |
| `src/components/institution/ClassMembersDialog.tsx` | Visualizar/gerenciar membros |
| `src/components/institution/FacilitatorDialog.tsx` | Dialog cadastro de facilitador |
| `src/components/institution/CsvImporter.tsx` | Parser + preview CSV |
| `supabase/functions/import-students/index.ts` | Edge function para importação em lote |

### Arquivos a modificar

| Arquivo | Mudança |
|---|---|
| `src/App.tsx` | Rotas `/institution`, `/institution/classes`, `/institution/facilitators`, `/institution/import`, `/institution/reports` protegidas por `admin_institution` |
| `src/components/DashboardLayout.tsx` | Adicionar links de navegação para facilitadores, importação e relatórios no menu `admin_institution` |
| `supabase/config.toml` | Registrar edge function `import-students` com `verify_jwt = false` |

### Edge Function: `import-students`
- Recebe array de `{ cpf, full_name, class_name }` + `institution_id`
- Valida token do requisitante (deve ser `admin_institution` da mesma instituição)
- Para cada aluno:
  - Verifica se CPF já existe em profiles
  - Se não: cria user no auth (email gerado = `cpf@placeholder.institution`), atualiza profile, atribui role `student`, vincula à instituição
  - Aloca na turma pelo nome (cria turma se não existir)
- Retorna resumo: `{ created: N, skipped: N, errors: [] }`

### Sem alterações de schema
Todas as tabelas (`classes`, `class_members`, `profiles`, `user_roles`) e RLS já existem e suportam o isolamento por `institution_id`.

