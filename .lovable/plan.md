

## Otimizar Dashboards com RPCs no Supabase

### Problema Atual
Os 3 dashboards fazem dezenas de queries sequenciais em loops `for`, resultando em 15-30+ round trips por carregamento. Cada iteracao de turma/mes/instituicao dispara queries adicionais.

### Solucao: 3 RPCs server-side

Cada dashboard recebe uma unica RPC que retorna todos os dados necessarios em uma unica chamada SQL.

---

### RPC 1: `get_admin_dashboard_data`

**Parametros**: `_start_date timestamptz`, `_end_date timestamptz`

**Retorna** JSON com:
- `kpis`: { institutions, students, trails, completion_pct }
- `students_per_institution`: [{ name, students }] (top 10)
- `monthly_growth`: [{ month, count }]
- `roles_distribution`: [{ role, count }]
- `top_students`: [{ full_name, xp_total, level }] (top 20, role=student)

**SQL**: Uma unica query com CTEs para cada agregacao, eliminando ~15-20 round trips.

---

### RPC 2: `get_institution_dashboard_data`

**Parametros**: `_user_id uuid`, `_start_date timestamptz`, `_end_date timestamptz`

**Retorna** JSON com:
- `kpis`: { classes, students, facilitators, avg_completion }
- `class_reports`: [{ name, student_count, completion_pct }]
- `weekly_completions`: [{ week_start, completions }]
- `top_students`: [{ full_name, xp_total, level }] (top 20)

**SQL**: Usa `get_user_institution_id` internamente para isolar dados do tenant.

---

### RPC 3: `get_facilitator_dashboard_data`

**Parametros**: `_user_id uuid`, `_start_date timestamptz`, `_end_date timestamptz`

**Retorna** JSON com:
- `kpis`: { classes, students, extras, avg_completion }
- `class_completions`: [{ name, completion }]
- `student_ranking`: [{ full_name, xp_total, level, class_name }]

**SQL**: Filtra por turmas onde o usuario e facilitador.

---

### Alteracoes nos Arquivos

| Arquivo | Acao |
|---|---|
| Migration SQL | Criar 3 RPCs `SECURITY DEFINER` com CTEs |
| `AdminDashboard.tsx` | Substituir ~15 queries por `supabase.rpc('get_admin_dashboard_data', ...)` |
| `InstitutionDashboard.tsx` | Substituir ~20 queries por `supabase.rpc('get_institution_dashboard_data', ...)` |
| `FacilitatorDashboard.tsx` | Substituir ~15 queries por `supabase.rpc('get_facilitator_dashboard_data', ...)` |

### Resultado
- **Admin**: 15-20 queries → 1 RPC
- **Instituicao**: 20-30 queries → 1 RPC
- **Facilitador**: 15-25 queries → 1 RPC
- Tempo de carregamento drasticamente reduzido
- Formatacao de datas (nomes de meses) permanece no frontend para manter locale `ptBR`

### Seguranca
Todas as RPCs usam `SECURITY DEFINER` com `search_path = public` para acessar dados cross-table sem depender de RLS (mesmo padrao das funcoes existentes como `has_role`). A RPC de instituicao valida o `institution_id` internamente; a de facilitador valida membership.

