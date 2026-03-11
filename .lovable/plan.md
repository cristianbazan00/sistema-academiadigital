

## Unificação: Dashboard + Conquistas do Aluno

### Situação Atual
A rota `/student/badges` renderiza exatamente o mesmo componente `StudentDashboard` — não existe uma página separada de conquistas. O card "Conquistas" com `BadgesList` já está no Dashboard. Ou seja, são duas entradas no menu que levam ao mesmo conteúdo.

### Alterações

| Arquivo | O que muda |
|---|---|
| `src/components/DashboardLayout.tsx` | Remover o item `{ to: "/student/badges", label: "Conquistas" }` do array `navByRole.student` |
| `src/App.tsx` | Remover a rota `/student/badges` (linhas 155-162) |

Resultado: o menu do aluno terá 3 itens (Dashboard, Minha Trilha, Relatórios) e as conquistas continuam visíveis no Dashboard.

