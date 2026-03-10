

## Diagnóstico

Dois problemas causam o redirecionamento incorreto do facilitador:

### 1. `redirectTo` quebrado na edge function
Na `activate-account` (linha 51), o `inviteUserByEmail` do facilitador usa:
```
redirectTo: `${SUPABASE_URL}/auth/v1/verify`
```
Isso não redireciona para a aplicação. A `create-institution-admin` faz corretamente usando `origin` do request header.

### 2. `ResetPassword.tsx` não detecta convites
A página só escuta o evento `PASSWORD_RECOVERY`, mas links de convite (`inviteUserByEmail`) disparam o evento `SIGNED_IN` — não `PASSWORD_RECOVERY`. Então o facilitador fica preso na tela "Verificando..." e o `AuthContext` o redireciona para `/` → que redireciona baseado na role.

Se a role estiver correta, deveria ir para `/facilitator`. Se por algum motivo a role não foi carregada a tempo, o fallback pode estar enviando para `/student`.

## Solução

| Arquivo | Mudança |
|---|---|
| `supabase/functions/activate-account/index.ts` | Usar `req.headers.get("origin")` para o `redirectTo` do `inviteUserByEmail`, igual à `create-institution-admin` |
| `src/pages/ResetPassword.tsx` | Escutar também o evento `SIGNED_IN` (para convites) além de `PASSWORD_RECOVERY` no `onAuthStateChange` |

### Detalhes

**Edge function** — trocar linha 51:
```typescript
const origin = req.headers.get("origin") || "https://id-preview--899820e8-9f41-4d02-805d-45d0357a2e6f.lovable.app";
// ...
redirectTo: `${origin}/reset-password`,
```

**ResetPassword.tsx** — no `useEffect`, aceitar ambos os eventos:
```typescript
if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
  setHasSession(true);
}
```

Isso garante que o facilitador, ao clicar o link do convite, chegue à tela de definição de senha, defina-a, e depois escolha o login adequado (CPF).

