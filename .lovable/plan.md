

## Resultado da Verificação do Fluxo

### 1. Criação de Instituição com Admin -- FUNCIONAL

Os network requests confirmam:
- Instituição "Oh Educação" criada com sucesso (POST `/institutions` retornou 201)
- Edge function `create-institution-admin` chamada com `cristian@oheducacao.com.br` e retornou `{ success: true, is_existing: true }`

Como o usuário **já existia**, o sistema vinculou o perfil à instituição e atribuiu a role `admin_institution` -- sem envio de convite (comportamento esperado).

### 2. Envio de E-mail de Convite -- OK (caminho para novos usuários)

O código da edge function está correto: para **novos** usuários, usa `inviteUserByEmail` com `redirectTo: origin/reset-password`, que envia e-mail automaticamente. No teste acima o usuário já existia, então esse caminho não foi exercitado. Para testar o envio real, seria necessário criar uma instituição com um email que **não existe** no Supabase Auth.

### 3. Recuperação de Senha em `/forgot-password/institution` -- FUNCIONAL

A página existe, usa `supabase.auth.resetPasswordForEmail` com redirect para `/reset-password`. O `ResetPassword.tsx` escuta o evento `PASSWORD_RECOVERY` corretamente.

### 4. Problema Identificado: Página `ResetPassword` redireciona apenas para `/login`

Quando o admin de instituição redefine a senha, o botão "Ir para o Login" leva para `/login` (CPF). Deveria levar para `/login/institution` para admins de instituição. No entanto, **não é possível saber no reset-password qual tipo de usuário está redefinindo**, então manter o link genérico para `/login` é aceitável, ou podemos adicionar ambos os links.

### 5. Problema Menor: `listUsers()` sem paginação

A edge function usa `listUsers()` sem parâmetros, que retorna no máximo 50 usuários por padrão. Com muitas instituições, isso pode falhar ao encontrar usuários existentes.

---

### Plano de Correções

| Arquivo | Mudança |
|---|---|
| `src/pages/ResetPassword.tsx` | Adicionar link secundário "Acesso Institucional" abaixo do botão principal na tela de sucesso |
| `supabase/functions/create-institution-admin/index.ts` | Usar `listUsers({ filter: admin_email })` para busca paginada/filtrada em vez de listar todos |

Ambas são melhorias pequenas. A funcionalidade principal está operacional.

