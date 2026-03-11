

## Ativação exclusiva para alunos CSV-importados

### Problema
1. A importação CSV cria usuários Auth com email fictício (`{cpf}@aluno.plataforma.local`) e senha temporária (o CPF). O `get_email_by_cpf` retorna esse email e a tela diz "já ativada".
2. Se o CPF não existe na importação, o fluxo atual permite criar um novo usuário — o que não deve ser permitido.

### Solução
Apenas alunos previamente importados via CSV podem ativar conta. O fluxo passa a ser:

```text
CPF informado
     │
     ▼
get_email_by_cpf retorna email?
     │
  ┌──┴──┐
  Não   Sim
  │     │
  │   Email termina com @aluno.plataforma.local?
  │     │
  │  ┌──┴──┐
  │  Não   Sim
  │  │     │
  │  │   → Exibe form: só senha + confirmar senha
  │  │     → Edge Function atualiza senha via updateUserById
  │  │     → "Conta ativada!"
  │  │
  │  └→ "Conta já ativada. Faça login."
  │
  └→ "CPF não encontrado. Contate sua instituição."
```

### Alterações

| Arquivo | O que muda |
|---|---|
| `ActivateAccount.tsx` | `handleCheckCpf`: usar `get_email_by_cpf` e verificar se email termina com `@aluno.plataforma.local`. Se sim → form simplificado (só senha). Se email real → "já ativada". Se não existe → "CPF não encontrado". Remover campos email e nome do form. |
| `activate-account/index.ts` | Adicionar action `activate_csv_student`: recebe `{cpf, password}`, busca profile pelo CPF, confirma email `@aluno.plataforma.local`, chama `updateUserById` para atualizar a senha. Remover o bloco que cria novos usuários (student account creation). |

### Frontend (`ActivateAccount.tsx`)
- `handleCheckCpf` chama `get_email_by_cpf`. Se retorna email com `@aluno.plataforma.local`, avança para form simplificado (apenas senha + confirmar senha). Se retorna outro email, mostra "já ativada". Se não retorna nada, mostra "CPF não encontrado. Contate sua instituição."
- Remover campos `fullName` e `email` do formulário — não são mais necessários.
- O submit chama a Edge Function com action `activate_csv_student`.

### Edge Function (`activate-account/index.ts`)
- Nova action `activate_csv_student`: recebe `{action, cpf, password}`. Valida senha forte. Busca profile por CPF, busca email do auth user, confirma que termina com `@aluno.plataforma.local`. Chama `admin.auth.admin.updateUserById(userId, { password })`. Retorna sucesso.
- Remover o bloco final que criava novos usuários Auth (linhas 82-153), pois não é mais permitido criar contas sem importação prévia.

