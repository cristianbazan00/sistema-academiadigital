

## Analise de Unificacao: Dashboard vs Relatorios (3 perfis)

---

### 1. Instituicao

| Informacao | Dashboard | Relatorios |
|---|---|---|
| Total Turmas | Sim | Sim (por turma) |
| Total Alunos | Sim | Sim (por turma) |
| Total Facilitadores | Sim | -- |
| Conclusao Media | Sim (fixo "--") | Sim (calculada por turma) |
| Conclusao por Turma (grafico) | -- | Sim |
| Evolucao Semanal (grafico) | -- | Sim |
| Ranking XP (grafico + tabela) | -- | Sim |
| Filtro de Data | -- | Sim |

**Veredicto: UNIFICAR.** Mesmo padrao do Admin Master -- Dashboard e um subconjunto fraco com KPIs quebrados ("--"). Reports tem tudo e mais.

---

### 2. Facilitador

| Informacao | Dashboard | Relatorios |
|---|---|---|
| Minhas Turmas (contagem) | Sim | -- |
| Alunos (contagem) | Sim | -- |
| Atividades Extras (contagem) | Sim | -- |
| Conclusao Media | Sim (fixo "--") | -- |
| Conclusao por Turma (grafico) | -- | Sim |
| Ranking Alunos XP (grafico + tabela) | -- | Sim |
| Filtro de Data | -- | Sim |

**Veredicto: UNIFICAR.** Mesmo caso -- Dashboard so tem KPI cards (um deles quebrado), Reports tem graficos e dados reais.

---

### 3. Aluno

| Informacao | Dashboard | Relatorios |
|---|---|---|
| Saudacao + Nome | Sim | -- |
| XP / Nivel / Barra | Sim | -- |
| Progresso na Trilha (barra + botao) | Sim | Sim (RadialBar) |
| Conquistas (BadgesList) | Sim | -- |
| Botao "Continuar Trilha" | Sim | -- |
| Evolucao de XP (AreaChart) | -- | Sim |
| Historico de XP (lista) | -- | Sim |
| Filtro de Data | -- | Sim |

**Veredicto: MANTER SEPARADOS.** O Dashboard do Aluno tem funcao distinta -- e uma "home" com acao rapida (continuar trilha, ver conquistas). Os Relatorios sao analiticos (graficos de evolucao, historico). Unificar tornaria a pagina longa demais e misturaria propositos diferentes.

---

### Plano de Implementacao

| Acao | Arquivo |
|---|---|
| Unificar Institution Dashboard + Reports | Absorver `InstitutionReports.tsx` em `InstitutionDashboard.tsx` (KPIs funcionais + graficos + filtro de data) |
| Deletar `InstitutionReports.tsx` | Remover arquivo |
| Unificar Facilitator Dashboard + Reports | Absorver `FacilitatorReports.tsx` em `FacilitatorDashboard.tsx` (KPIs + graficos + filtro de data) |
| Deletar `FacilitatorReports.tsx` | Remover arquivo |
| Manter Student Dashboard e Reports separados | Sem alteracao |
| Atualizar `DashboardLayout.tsx` | Remover link "Relatorios" de `admin_institution` e `facilitator` |
| Atualizar `App.tsx` | Remover rotas `/institution/reports` e `/facilitator/reports` |

### Detalhes tecnicos

**InstitutionDashboard.tsx** recebera:
- KPI cards: Turmas, Alunos, Facilitadores, Conclusao Media (calculada, nao mais "--")
- DateRangeFilter
- BarChart: conclusao por turma
- LineChart: evolucao semanal de conclusoes
- Ranking XP (BarChart horizontal + Table) -- filtrado por role student

**FacilitatorDashboard.tsx** recebera:
- KPI cards: Turmas, Alunos, Atividades Extras, Conclusao Media (calculada)
- Saudacao com nome do facilitador
- DateRangeFilter
- BarChart: conclusao por turma
- Ranking Alunos XP (BarChart horizontal + Table)

