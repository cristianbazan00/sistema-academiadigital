

## CRUD Completo para Facilitadores

### Situação Atual
A tela de facilitadores só permite **criar** e **gerenciar turmas**. Falta editar nome e remover facilitadores.

### Alterações

**1. Edge Function `activate-account` — Novas actions**
- `update_facilitator`: recebe `user_id` e `full_name`, atualiza `profiles` via service role
- `delete_facilitator`: recebe `user_id`, remove de `class_members`, `user_roles`, limpa `institution_id` do profile, e deleta o usuário do auth

**2. `FacilitatorDialog.tsx` — Suportar modo edição**
- Receber prop opcional `facilitator: { id, full_name }` para modo edição
- Em modo edição: preencher campos, ocultar email/CPF (não editáveis), chamar action `update_facilitator`
- Em modo criação: comportamento atual

**3. `InstitutionFacilitators.tsx` — Botões de editar e remover**
- Adicionar botão de editar (ícone Pencil) que abre `FacilitatorDialog` em modo edição
- Adicionar botão de remover (ícone Trash2) com `AlertDialog` de confirmação
- Ao confirmar remoção, chamar action `delete_facilitator` na edge function

### Arquivos

| Arquivo | Ação |
|---------|------|
| `supabase/functions/activate-account/index.ts` | Adicionar actions `update_facilitator` e `delete_facilitator` |
| `src/components/institution/FacilitatorDialog.tsx` | Suportar modo edição com prop `facilitator` |
| `src/pages/institution/InstitutionFacilitators.tsx` | Adicionar botões editar/remover com confirmação |

