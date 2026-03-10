

## Adicionar Skeleton Loading nos 3 Dashboards

### Abordagem
Criar um componente `DashboardSkeleton` reutilizavel que replica a estrutura visual dos dashboards (KPI cards + graficos + tabela) usando o componente `Skeleton` existente. Substituir o spinner `Loader2` atual nos 3 dashboards por este skeleton.

### Componente novo: `src/components/DashboardSkeleton.tsx`

Recebe `kpiCount` (4 por padrao) e `sections` (numero de cards de grafico, padrao 3). Renderiza:
- Grid de KPI cards skeleton (icone circular + 2 linhas de texto)
- Cards de grafico skeleton (titulo + retangulo grande)
- Card de tabela skeleton (titulo + linhas)

### Alteracoes nos dashboards

| Arquivo | Alteracao |
|---|---|
| `AdminDashboard.tsx` | Substituir bloco `if (loading)` (linhas 96-104) por `<DashboardSkeleton kpiCount={4} sections={4} />` |
| `InstitutionDashboard.tsx` | Substituir bloco `if (loading)` (linhas 90-98) por `<DashboardSkeleton kpiCount={4} sections={3} />` |
| `FacilitatorDashboard.tsx` | Substituir bloco `if (loading)` (linhas 83-91) por `<DashboardSkeleton kpiCount={3} sections={2} />` |

Todos envolvidos em `<DashboardLayout>` como ja estao.

