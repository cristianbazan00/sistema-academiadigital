

## Atualizar Dashboard Admin Master

### Alterações necessárias

**1. Migração SQL** — Atualizar a RPC `get_admin_dashboard_data` para:
- Adicionar KPI `facilitators` (count de `user_roles` com `role = 'facilitator'`)
- Adicionar `classes_per_institution` (count de `classes` agrupado por instituição)
- Remover a CTE `roles_dist` e o campo `roles_distribution` do retorno

**2. Frontend** — `src/pages/admin/AdminDashboard.tsx`:
- Atualizar interface `DashboardData`:
  - Adicionar `facilitators` aos KPIs
  - Adicionar `classes_per_institution: { name: string; classes: number }[]`
  - Remover `roles_distribution`
- Adicionar KPI card "Facilitadores" (com ícone `Users`)
- Alterar grid de KPIs para 5 colunas (`lg:grid-cols-5`)
- Adicionar gráfico "Turmas por Instituição" (BarChart) no lugar do PieChart de distribuição de papéis
- Remover código do PieChart, constantes `COLORS`, `roleNames` e imports não usados (`PieChart`, `Pie`, `Cell`)

### RPC atualizada (resumo)

```sql
-- Novas CTEs:
kpi_facilitators AS (
  SELECT count(*) AS cnt FROM user_roles WHERE role = 'facilitator'
),
classes_per_inst AS (
  SELECT i.name, count(c.id) AS classes
  FROM institutions i
  LEFT JOIN classes c ON c.institution_id = i.id
  GROUP BY i.id, i.name
  ORDER BY classes DESC LIMIT 10
)

-- KPIs: adiciona 'facilitators'
-- Retorno: adiciona 'classes_per_institution', remove 'roles_distribution'
```

