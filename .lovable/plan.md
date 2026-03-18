

## Correção: Turmas do facilitador aparecem como "Nenhuma turma"

### Causa raiz
A tabela `class_members` possui **duas foreign keys duplicadas** para `classes(id)`:
- `class_members_class_id_fkey`
- `fk_class_members_class`

Quando o PostgREST encontra múltiplas FKs apontando para a mesma tabela, ele não consegue resolver automaticamente a sintaxe `classes(id, name)` no `.select()`, e retorna `null` para o join. O mesmo ocorre com `user_id` (FKs para `auth.users` e `profiles`).

### Solução

**1. Migração SQL — Remover FKs duplicadas**

```sql
ALTER TABLE class_members DROP CONSTRAINT fk_class_members_class;
ALTER TABLE class_members DROP CONSTRAINT fk_class_members_user;
```

Mantém apenas `class_members_class_id_fkey` e `class_members_user_id_fkey` (as originais).

**2. Alternativa (mais segura, sem alterar schema)**

Adicionar o hint de FK explícito nos selects que fazem join com `classes`:

| Arquivo | Linha | De | Para |
|---------|-------|----|------|
| `InstitutionFacilitators.tsx` | 51 | `classes(id, name)` | `classes!class_members_class_id_fkey(id, name)` |
| `ManageFacilitatorClassesDialog.tsx` | 49 | `classes(id, name)` | `classes!class_members_class_id_fkey(id, name)` |

### Recomendação

Aplicar **ambas** as correções: remover as FKs duplicadas (limpeza) e adicionar os hints nos selects (robustez). A remoção das FKs duplicadas previne o mesmo problema em queries futuras.

### Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| Migração SQL | Remover FKs duplicadas `fk_class_members_class` e `fk_class_members_user` |
| `src/pages/institution/InstitutionFacilitators.tsx` | Adicionar hint `!class_members_class_id_fkey` no select |
| `src/components/institution/ManageFacilitatorClassesDialog.tsx` | Adicionar hint `!class_members_class_id_fkey` no select |

