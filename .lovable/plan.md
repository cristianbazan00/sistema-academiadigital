

## Plano: Vincular/Alterar Admin e Remover Instituição

### O que será implementado

**1. Seção de Admin no modo edição do `InstitutionDialog`**
- Ao editar uma instituição, buscar o admin atual (profile com `institution_id` + role `admin_institution`)
- Exibir nome e email do admin atual
- Campos para informar novo email/nome de admin (opcional)
- Ao salvar com novos dados de admin, invocar a edge function `create-institution-admin` para vincular/trocar o admin

**2. Botão de remover instituição no `AdminInstitutions`**
- Adicionar botão de lixeira (Trash) na coluna de ações de cada linha
- Confirmar via `AlertDialog` antes de deletar
- Ao confirmar, deletar a instituição via `supabase.from("institutions").delete()`
- Dados dependentes (classes, class_members, profiles.institution_id) precisam ser tratados — vamos usar uma edge function `delete-institution` para limpar dados relacionados com service role

**3. Edge Function `delete-institution`**
- Recebe `institution_id`, valida que o caller é `admin_master`
- Remove class_members das classes da instituição
- Remove classes da instituição
- Desvincula profiles (`institution_id = null`) e remove roles `admin_institution`/`facilitator`/`student` dos usuários da instituição
- Deleta a instituição

### Arquivos a modificar

| Arquivo | Mudança |
|---|---|
| `src/components/admin/InstitutionDialog.tsx` | Buscar admin atual ao editar; campos opcionais para trocar admin; invocar edge function |
| `src/pages/admin/AdminInstitutions.tsx` | Botão de remover com AlertDialog de confirmação; invocar edge function de delete |

### Arquivo a criar

| Arquivo | Descrição |
|---|---|
| `supabase/functions/delete-institution/index.ts` | Edge function para remoção segura da instituição e dados relacionados |

### Arquivo a atualizar

| Arquivo | Mudança |
|---|---|
| `supabase/config.toml` | Registrar `delete-institution` com `verify_jwt = false` |

