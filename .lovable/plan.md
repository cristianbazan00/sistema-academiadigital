

## Correcao: Graficos do Admin Dashboard contam todos os usuarios, nao apenas alunos

### Problema
Na RPC `get_admin_dashboard_data`, duas CTEs contam **todos** os perfis da tabela `profiles` sem filtrar por role:

1. **`monthly`** (Novos Alunos por Mes): Conta todos os `profiles.created_at`, incluindo admin_master, facilitadores, etc. O "1 aluno" que aparece e na verdade o Admin Master.
2. **`inst_students`** (Alunos por Instituicao): Conta todos os `profiles` vinculados a uma instituicao, sem verificar se sao alunos.

As RPCs de Instituicao e Facilitador estao corretas -- ambas filtram por `class_members.role = 'student'`.

### Solucao
Alterar a migration SQL para corrigir as duas CTEs, adicionando `JOIN user_roles` com filtro `role = 'student'`:

**CTE `monthly`** -- de:
```sql
FROM profiles p
WHERE p.created_at >= ...
```
Para:
```sql
FROM profiles p
JOIN user_roles ur ON ur.user_id = p.id AND ur.role = 'student'
WHERE p.created_at >= ...
```

**CTE `inst_students`** -- de:
```sql
LEFT JOIN profiles p ON p.institution_id = i.id
```
Para:
```sql
LEFT JOIN profiles p ON p.institution_id = i.id
  AND EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = p.id AND ur.role = 'student')
```

### Arquivos

| Arquivo | Acao |
|---|---|
| Nova migration SQL | Recriar `get_admin_dashboard_data` com filtro de role nas CTEs `monthly` e `inst_students` |

Nenhuma alteracao no frontend -- os componentes ja consomem os dados corretamente.

