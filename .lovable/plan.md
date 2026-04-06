

## CRUD Completo para Facilitadores — Implementação

O plano foi verificado e **não foi executado**. Todos os três arquivos estão no estado original. Vou implementar agora.

### Alterações

**1. `supabase/functions/activate-account/index.ts`**
- Adicionar action `update_facilitator` (recebe `user_id`, `full_name`, atualiza `profiles`)
- Adicionar action `delete_facilitator` (recebe `user_id`, remove de `class_members`, `user_roles`, limpa `institution_id`, deleta usuário do auth)

**2. `src/components/institution/FacilitatorDialog.tsx`**
- Adicionar prop opcional `facilitator: { id, full_name } | null`
- Em modo edição: preencher nome, ocultar email/CPF, chamar `update_facilitator`
- Em modo criação: comportamento atual
- Usar `useEffect` para preencher campos quando `facilitator` muda

**3. `src/pages/institution/InstitutionFacilitators.tsx`**
- Adicionar botão Pencil (editar) que abre FacilitatorDialog em modo edição
- Adicionar botão Trash2 (remover) com AlertDialog de confirmação
- Ao confirmar, chamar `delete_facilitator` na edge function

### Arquivos

| Arquivo | Ação |
|---------|------|
| `supabase/functions/activate-account/index.ts` | Adicionar 2 novas actions |
| `src/components/institution/FacilitatorDialog.tsx` | Suportar modo edição |
| `src/pages/institution/InstitutionFacilitators.tsx` | Botões editar/remover |

