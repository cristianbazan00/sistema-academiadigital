

## Fase 2: Autenticação e Onboarding

### Estado Atual
- Login existe mas usa **email** — o escopo pede **CPF**
- AuthContext funciona com `signInWithPassword` (email-based)
- Não há fluxo de ativação de conta nem recuperação de senha
- Não há proteção de rotas (qualquer URL é acessível sem autenticação)

### Problema: Login por CPF
Supabase Auth usa email como identificador. Para login por CPF, a estratégia será:
- O CPF será armazenado na tabela `profiles` (já tem coluna `cpf`)
- Na tela de login, o usuário digita CPF + senha
- O frontend faz lookup do email via uma **database function** (`get_email_by_cpf`) com `security definer` que busca o email correspondente ao CPF, e então chama `signInWithPassword` com o email encontrado
- Isso mantém compatibilidade total com Supabase Auth

### O que será implementado

**1. Database function `get_email_by_cpf`**
- Função `security definer` que recebe CPF, busca o `id` em `profiles`, e retorna o email de `auth.users`
- Chamada via `supabase.rpc('get_email_by_cpf', { _cpf: '...' })`

**2. Tela de Login reformulada (`/login`)**
- Campo CPF (com máscara `000.000.000-00`) + Senha
- Busca email via RPC, depois faz `signInWithPassword`
- Link "Esqueci minha senha" e link "Ativar minha conta"

**3. Tela de Ativação de Conta (`/activate`)**
- Aluno pré-cadastrado digita CPF
- Sistema verifica se CPF existe e se a conta ainda não foi ativada (senha não definida)
- Se válido: solicita email, nome completo e senha forte (mín. 8 chars, maiúscula, número, especial)
- Cria o usuário via uma **edge function** `activate-account` que usa `service_role` para: criar user no auth, atualizar profile com CPF, atribuir role `student`

**4. Tela de Recuperação de Senha (`/forgot-password`)**
- Usuário informa CPF
- Sistema busca o email associado via RPC e envia `resetPasswordForEmail`
- Mostra mensagem de confirmação (sem revelar se CPF existe)

**5. Tela de Redefinição de Senha (`/reset-password`)**
- Recebe token via URL hash após click no email
- Formulário para nova senha com validação de força
- Chama `supabase.auth.updateUser({ password })`

**6. Componente ProtectedRoute**
- Wrapper que verifica autenticação e role
- Redireciona para `/login` se não autenticado
- Redireciona para `/` se role não autorizada para a rota
- Aplicado em todas as rotas protegidas no `App.tsx`

**7. Utilitário de máscara/validação de CPF**
- Formatação visual `000.000.000-00`
- Validação de dígitos verificadores
- Componente `CpfInput` reutilizável

### Arquivos a criar/modificar

| Arquivo | Ação |
|---|---|
| `supabase/migrations/...` | Criar função `get_email_by_cpf` |
| `supabase/functions/activate-account/` | Edge function para ativação |
| `src/lib/cpf.ts` | Utilitários de máscara e validação CPF |
| `src/components/CpfInput.tsx` | Input com máscara de CPF |
| `src/components/ProtectedRoute.tsx` | Guard de rotas |
| `src/components/PasswordStrength.tsx` | Indicador visual de força da senha |
| `src/pages/Login.tsx` | Refatorar para CPF |
| `src/pages/ActivateAccount.tsx` | Nova tela |
| `src/pages/ForgotPassword.tsx` | Nova tela |
| `src/pages/ResetPassword.tsx` | Nova tela |
| `src/contexts/AuthContext.tsx` | Adicionar método `activateAccount` |
| `src/App.tsx` | Novas rotas + ProtectedRoute |

