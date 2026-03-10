

## Problema

O diálogo de cadastro de facilitador não solicita CPF. Como facilitadores fazem login via `/login` (que usa CPF), sem CPF cadastrado no perfil eles não conseguem logar.

Além disso, a edge function `activate-account` **não trata** a action `create_facilitator` — ela só processa o fluxo de ativação de aluno. O cadastro de facilitador está silenciosamente falhando.

## Solução

### 1. `src/components/institution/FacilitatorDialog.tsx`
- Adicionar campo CPF usando o componente `CpfInput` já existente
- Validar CPF com `isValidCpf` antes de enviar
- Enviar `cpf` no body da request
- Incluir CPF na validação do botão de submit

### 2. `supabase/functions/activate-account/index.ts`
Adicionar tratamento para `action: "create_facilitator"` no início da função:
- Receber `{ action, email, full_name, cpf, institution_id }`
- Criar usuário via `admin.auth.admin.createUser` com email e senha temporária
- Atualizar profile com `cpf`, `full_name`, `institution_id`
- Inserir role `facilitator` em `user_roles`
- Enviar convite por email via `admin.auth.admin.generateLink({ type: "magiclink" })` ou `inviteUserByEmail` para que o facilitador defina sua senha
- Retornar sucesso

O fluxo do facilitador será: instituição cadastra → facilitador recebe email → define senha → faz login com CPF.

### Arquivos

| Arquivo | Mudança |
|---|---|
| `src/components/institution/FacilitatorDialog.tsx` | Adicionar campo CPF com validação |
| `supabase/functions/activate-account/index.ts` | Adicionar handler para `action: "create_facilitator"` |

