

## Exibir turmas atribuídas a cada facilitador

### Alteração

**`src/pages/institution/InstitutionFacilitators.tsx`**:
1. Após buscar os facilitadores, consultar `class_members` filtrando por `role = 'facilitator'` e os IDs dos facilitadores, junto com `classes` para obter os nomes das turmas.
2. Montar um mapa `facilitatorId → [nomes das turmas]` e adicionar ao estado.
3. Adicionar coluna "Turmas" na tabela, exibindo os nomes das turmas como badges. Se não houver turmas, mostrar "Nenhuma turma".

### Interface atualizada

| Nome | Turmas |
|---|---|
| João Silva | `Turma A` `Turma B` |
| Maria Santos | Nenhuma turma |

A consulta usa `class_members` (join com `classes.name`) filtrado pelos IDs dos facilitadores da instituição. Sem migração SQL necessária.

