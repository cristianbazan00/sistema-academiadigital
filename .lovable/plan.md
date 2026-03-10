

## Análise: Dashboard vs Relatórios do Admin Master

### Sobreposição

| Informação | Dashboard | Relatórios |
|---|---|---|
| Total Instituições | ✅ | ✅ |
| Total Alunos | ✅ | ✅ |
| Total Trilhas | ✅ | ✅ |
| Taxa de Conclusão | ✅ (fixo "—") | ✅ (calculada) |
| Alunos por Instituição | — | ✅ |
| Novos Alunos por Mês | — | ✅ |
| Distribuição de Papéis | — | ✅ |
| Top 20 Alunos por XP | — | ✅ |
| Atividade Recente | ✅ (placeholder vazio) | — |
| Filtro de Data | — | ✅ |

**Conclusão**: O Dashboard é um subconjunto fraco do Relatórios. Os 4 KPI cards são idênticos (e no Dashboard a taxa de conclusão nem funciona — mostra "—"). O card "Atividade Recente" é apenas um placeholder sem dados reais. Não há justificativa para manter duas páginas separadas.

### Recomendação: Unificar em um único painel

Absorver tudo na página **Dashboard** (`/admin`), eliminando `/admin/reports`.

### Plano

1. **`AdminDashboard.tsx`** — Substituir pelo conteúdo completo do `AdminReports.tsx`, mantendo o título "Painel Admin Master" e adicionando o filtro de data e todos os gráficos (BarChart, LineChart, PieChart, tabela Top 20).

2. **Remover `AdminReports.tsx`** — Arquivo não será mais necessário.

3. **`DashboardLayout.tsx`** — Remover o link "Relatórios" do menu `admin_master`.

4. **`App.tsx`** — Remover a rota `/admin/reports`.

### Resultado

- Uma única página `/admin` com KPIs funcionais, filtro de data, gráficos e ranking
- Navegação mais limpa no sidebar (sem item redundante)
- Zero perda de funcionalidade

