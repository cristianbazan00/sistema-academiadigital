

## Diagnóstico

O problema está na Edge Function `create-institution-admin`. Quando um novo admin é criado:
1. O usuário é criado com uma senha temporária aleatória (`Temp@...`)
2. `generateLink({ type: "recovery" })` é chamado, mas essa API apenas **gera** o link de recuperação — **não envia e-mail automaticamente**
3. O link gerado não é retornado nem enviado para ninguém
4. Resultado: o admin da instituição não tem como saber sua senha nem recebe link para definir uma

Além disso, o link "Esqueci minha senha" na tela `/login/institution` aponta para `/forgot-password`, que pede **CPF** — inútil para instituições que usam email.

## Solução

Duas correções complementares:

### 1. Edge Function: usar `inviteUserByEmail` em vez de `createUser` + `generateLink`

Na `create-institution-admin/index.ts`, substituir o bloco de criação de novo usuário para usar `supabase.auth.admin.inviteUserByEmail()`. Essa API:
- Cria o usuário no Auth
- Envia automaticamente um e-mail de convite com link para definir senha
- O link redireciona para `/reset-password` onde o admin define sua senha

Passaremos `redirectTo: origin + '/reset-password'` para que o fluxo termine na página de redefinição de senha já existente.

### 2. Criar página de recuperação de senha por email para instituições

Criar `/forgot-password/institution` com campo de **email** (não CPF), que chama `supabase.auth.resetPasswordForEmail(email, { redirectTo: .../reset-password })`.

Atualizar o link "Esqueci minha senha" em `LoginInstitution.tsx` para apontar para esta nova rota.

### Arquivos

| Arquivo | Ação |
|---|---|
| `supabase/functions/create-institution-admin/index.ts` | Trocar `createUser` + `generateLink` por `inviteUserByEmail` com `redirectTo` |
| `src/pages/ForgotPasswordInstitution.tsx` | Criar — recuperação por email |
| `src/App.tsx` | Adicionar rota `/forgot-password/institution` |
| `src/pages/LoginInstitution.tsx` | Atualizar link "Esqueci minha senha" para `/forgot-password/institution` |

