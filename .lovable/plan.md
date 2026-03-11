

## Gerenciar turmas do facilitador na tela de facilitadores

### Situação Atual
A tabela de facilitadores exibe badges com nomes das turmas, mas sem ações. O modelo já suporta múltiplos facilitadores por turma (tabela `class_members` com `role = 'facilitator'`).

### Alterações

**`src/pages/institution/InstitutionFacilitators.tsx`**:
1. Alterar o estado para armazenar objetos `{ classId, className }` em vez de apenas nomes de turmas.
2. Adicionar coluna "Ações" com botão para abrir um dialog de gerenciamento de turmas do facilitador.
3. Importar e renderizar o novo `ManageFacilitatorClassesDialog`.

**Novo componente `src/components/institution/ManageFacilitatorClassesDialog.tsx`**:
- Dialog que recebe `facilitatorId`, `facilitatorName`, `open`, `onOpenChange`, `onSaved`.
- Lista as turmas atuais do facilitador com botão de remover (X) ao lado de cada uma.
- Select para adicionar o facilitador a novas turmas (turmas da instituição que ele ainda não está atribuído).
- Ações:
  - **Adicionar**: insere em `class_members` com `role = 'facilitator'`.
  - **Remover**: deleta de `class_members` filtrando por `class_id`, `user_id`, `role = 'facilitator'`.
- Busca turmas da instituição via `classes` filtrando por `institution_id`.

### UI do Dialog

| Turmas atribuídas | Ação |
|---|---|
| Turma A | [X remover] |
| Turma B | [X remover] |

[ Select: adicionar turma ] [ + Adicionar ]

Sem migração SQL necessária — a estrutura existente já suporta múltiplos facilitadores por turma.

