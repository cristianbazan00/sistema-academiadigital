

## Plano: Relatórios com Gráficos para Todos os Perfis

### Visão Geral

Criar páginas de relatórios dedicadas para Admin Master, Facilitador e Aluno (Instituição já tem). Enriquecer o relatório da Instituição com gráficos Recharts. Adicionar links de navegação no sidebar.

---

### 1. Admin Master -- Nova página `AdminReports.tsx`

**Rota**: `/admin/reports`

**Conteúdo**:
- **Cards KPI**: Total instituições, alunos, trilhas, taxa de conclusão global
- **Gráfico BarChart**: Alunos por instituição (top 10)
- **Gráfico LineChart**: Novos alunos por mês (últimos 6 meses, baseado em `profiles.created_at`)
- **Gráfico PieChart**: Distribuição de papéis (admin, facilitador, aluno)
- **Tabela**: Top 20 alunos por XP (global)

**Dados**: Queries em `profiles`, `user_roles`, `institutions`, `lesson_progress`

---

### 2. Facilitador -- Nova página `FacilitatorReports.tsx`

**Rota**: `/facilitator/reports`

**Conteúdo**:
- **Gráfico BarChart**: Conclusão por turma (% das lições concluídas por turma)
- **Gráfico BarChart horizontal**: XP dos alunos por turma
- **Tabela ranking**: Alunos ordenados por XP nas turmas do facilitador

**Dados**: Queries em `class_members`, `profiles`, `lesson_progress`, `classes`

---

### 3. Aluno -- Nova página `StudentReports.tsx`

**Rota**: `/student/reports`

**Conteúdo**:
- **Gráfico AreaChart**: Evolução de XP ao longo do tempo (baseado em `user_xp_log.created_at`)
- **Gráfico RadialBarChart**: Progresso geral na trilha (% concluído)
- **Lista**: Histórico de XP ganho (últimas 20 entradas de `user_xp_log`)

**Dados**: Queries em `user_xp_log`, `lesson_progress`

---

### 4. Instituição -- Enriquecer `InstitutionReports.tsx`

**Adicionar gráficos**:
- **BarChart**: Conclusão por turma (substituir o Progress por gráfico de barras)
- **LineChart**: Evolução de conclusões ao longo do tempo (baseado em `lesson_progress.completed_at`, agrupado por semana nos últimos 2 meses)
- **BarChart**: Top 10 alunos por XP (visual do ranking existente)

---

### 5. Navegação e Rotas

**`DashboardLayout.tsx`**: Adicionar link "Relatórios" no sidebar para admin_master, facilitator e student

**`App.tsx`**: Adicionar rotas protegidas:
- `/admin/reports` -> `AdminReports`
- `/facilitator/reports` -> `FacilitatorReports`
- `/student/reports` -> `StudentReports`

---

### RLS

Nenhuma nova policy necessária. As policies existentes já cobrem:
- Admin Master: lê tudo
- Facilitador: lê progresso/perfis dos alunos das suas turmas
- Aluno: lê próprio `user_xp_log` e `lesson_progress`
- Instituição: lê progresso da instituição

---

### Arquivos

| Arquivo | Ação |
|---|---|
| `src/pages/admin/AdminReports.tsx` | Criar |
| `src/pages/facilitator/FacilitatorReports.tsx` | Criar |
| `src/pages/student/StudentReports.tsx` | Criar |
| `src/pages/institution/InstitutionReports.tsx` | Editar (adicionar gráficos) |
| `src/components/DashboardLayout.tsx` | Editar (links sidebar) |
| `src/App.tsx` | Editar (novas rotas) |

Todos os gráficos usam `recharts` (já instalado) com os componentes `ChartContainer` de `src/components/ui/chart.tsx`.

