

## Atribuir Facilitadores a Turmas (Perfil Instituição)

### Situação Atual
- `ClassMembersDialog` é somente leitura — exibe membros mas não permite adicionar/remover.
- `FacilitatorClasses` (lado facilitador) já funciona: lê `class_members` com `role = 'facilitator'`.
- RLS de `class_members` já permite `admin_institution` gerenciar membros de turmas da sua instituição.
- Não são necessárias alterações no banco de dados.

### Solução

Expandir o `ClassMembersDialog` para permitir que o admin da instituição adicione e remova facilitadores das turmas.

### Alterações

| Arquivo | Ação |
|---|---|
| `ClassMembersDialog.tsx` | Adicionar funcionalidade de atribuir/remover facilitadores |

**Detalhes da alteração em `ClassMembersDialog`:**

1. Adicionar um `Select` dropdown no topo do dialog com a lista de facilitadores da instituição (mesma query de `InstitutionFacilitators`: profiles com `user_roles.role = 'facilitator'` e `institution_id` da instituição).
2. Botão "Adicionar" ao lado do select — insere em `class_members` com `role = 'facilitator'`.
3. Filtrar o select para não mostrar facilitadores já atribuídos à turma.
4. Adicionar botão "Remover" (ícone X) ao lado de cada facilitador na tabela de membros — deleta da `class_members`.
5. Não permitir remover alunos (apenas facilitadores podem ser gerenciados por este dialog).
6. Recarregar a lista de membros após cada operação.

```text
┌─────────────────────────────────────┐
│ Membros — Turma X                   │
│                                     │
│ [Select facilitador ▾] [+ Adicionar]│
│                                     │
│ Nome              Papel    Ação     │
│ ─────────────────────────────────── │
│ João Silva     Facilitador  [✕]     │
│ Maria Santos      Aluno             │
│ Pedro Lima        Aluno             │
└─────────────────────────────────────┘
```

O facilitador, ao ser adicionado como membro da turma, automaticamente verá a turma na página "Minhas Turmas" (`FacilitatorClasses`), pois essa página já consulta `class_members` com `role = 'facilitator'`. Não é necessária nenhuma alteração no lado do facilitador.

