

## Correção: Filtrar apenas alunos no ranking Top 20

### Problema
A query do ranking busca todos os `profiles` sem filtrar por role. O Admin Master (e qualquer facilitador/admin de instituição) aparece no ranking.

### Solução
Fazer um join com `user_roles` para filtrar apenas usuários com role `student`:

**`AdminDashboard.tsx`** — Alterar a query do Top 20:
- Buscar IDs de alunos em `user_roles` onde `role = 'student'`
- Usar esses IDs para filtrar `profiles` com `.in('id', studentIds)`
- Manter o `.order("xp_total", { ascending: false }).limit(20)`

Mesma correção deve ser aplicada em `InstitutionReports.tsx` e `FacilitatorReports.tsx` se tiverem rankings similares.

### Arquivos
| Arquivo | Ação |
|---|---|
| `src/pages/admin/AdminDashboard.tsx` | Filtrar Top 20 por role student |
| `src/pages/institution/InstitutionReports.tsx` | Verificar e corrigir se necessário |
| `src/pages/facilitator/FacilitatorReports.tsx` | Verificar e corrigir se necessário |

