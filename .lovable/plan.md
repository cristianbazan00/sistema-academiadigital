

## Plano: Separar Login da Instituição (Email/Senha) do Login de Facilitadores/Alunos (CPF/Senha)

### O que será feito

Criar uma página de login exclusiva para instituições (`/login/institution`) com autenticação por **email e senha**, e manter a página atual (`/login`) apenas para **facilitadores e alunos** com CPF.

### Arquivos a criar

| Arquivo | Descrição |
|---|---|
| `src/pages/LoginInstitution.tsx` | Página de login para instituições com campos de email e senha, visual similar ao login atual mas com identidade própria (ícone Building2, título "Acesso Institucional") |

### Arquivos a modificar

| Arquivo | Mudança |
|---|---|
| `src/pages/Login.tsx` | Alterar subtítulo para "Acesso para Facilitadores e Alunos", adicionar link "Sou Instituição" que redireciona para `/login/institution` |
| `src/App.tsx` | Adicionar rota `/login/institution` apontando para `LoginInstitution` |

### Detalhes

**LoginInstitution.tsx:**
- Campos: Email + Senha (sem CPF)
- Login direto via `signIn(email, password)` do AuthContext
- Links: "Esqueci minha senha" e "Sou Facilitador/Aluno" (volta para `/login`)
- Visual: mesmo card style, ícone Building2, título "Acesso Institucional"

**Login.tsx (atual):**
- Mantém CPF + Senha como está
- Adiciona subtítulo "Facilitadores e Alunos"
- Adiciona link "Sou Instituição" no rodapé do formulário

