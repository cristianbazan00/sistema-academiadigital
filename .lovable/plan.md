

## Facilitador: Visualizar Trilha e Evolução Individual do Aluno

### Funcionalidades

**1. Seção "Conteúdo da Trilha" no Dashboard do Facilitador**
- Após os gráficos existentes, adicionar uma seção com accordion mostrando a estrutura da trilha (Módulos > Aulas) das turmas do facilitador.
- Consulta: `class_members` (facilitator) → `classes` (trail_id) → `modules` → `lessons`, agrupados por turma/trilha.
- Exibe módulos em accordion com suas aulas listadas (título e ordem).

**2. Dialog de Evolução Individual do Aluno**
- No ranking de alunos (dashboard) e na tabela de alunos (FacilitatorClasses), tornar o nome do aluno clicável.
- Ao clicar, abrir um Dialog/Sheet mostrando:
  - KPIs: XP total, nível, % de conclusão da trilha
  - Progresso por aula: lista de aulas com status (concluída ✓ / pendente)
  - Histórico de XP recente (últimos 20 registros de `user_xp_log`)
- Consultas: `lesson_progress` do aluno, `user_xp_log` do aluno, `class_members` → `classes` → trail → modules → lessons.

### Arquivos

**Novo: `src/components/facilitator/StudentProgressDialog.tsx`**
- Props: `studentId`, `studentName`, `open`, `onOpenChange`
- Carrega: classe do aluno → trail → modules → lessons → lesson_progress
- Carrega: `user_xp_log` (últimos 20)
- Exibe: KPIs (XP, nível, % conclusão), lista de aulas com ícone CheckCircle/Circle, histórico XP

**Novo: `src/components/facilitator/TrailContentSection.tsx`**
- Props: nenhuma (busca dados do facilitador logado)
- Carrega turmas do facilitador → trails → modules → lessons
- Exibe accordion por turma/trilha com módulos e aulas

**Editar: `src/pages/facilitator/FacilitatorDashboard.tsx`**
- Importar e renderizar `TrailContentSection` após os cards existentes
- Importar `StudentProgressDialog`
- Tornar nomes clicáveis no ranking (adicionar `user_id` ao `student_ranking`)
- Estado para controlar dialog de progresso do aluno

**Editar: `src/pages/facilitator/FacilitatorClasses.tsx`**
- Importar `StudentProgressDialog`
- Tornar nomes dos alunos clicáveis na tabela de cada turma

**Editar RPC `get_facilitator_dashboard_data`** (migração SQL)
- Adicionar `user_id` ao retorno de `student_ranking` (necessário para buscar dados individuais)

### Sem novas tabelas ou RLS — dados já acessíveis ao facilitador via políticas existentes.

