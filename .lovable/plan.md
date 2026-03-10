

## Correção: Erro ao criar facilitador — "non-2xx status code"

### Problema
A Edge Function `activate-account` retorna `status: 400` quando há erros de validação (CPF duplicado, campos faltando, etc.). O `supabase.functions.invoke` trata qualquer resposta não-2xx como `FunctionsHttpError`, colocando-a em `response.error` como um objeto de erro genérico. O frontend faz `String(response.error)` que resulta em `"FunctionsHttpError: Edge Function returned a non-2xx status code"` — perdendo a mensagem real do erro.

### Solução

Duas alterações necessárias:

**1. Edge Function (`activate-account/index.ts`)**: Alterar o bloco `create_facilitator` para retornar **status 200** sempre, com `{ error: "mensagem" }` no body quando houver erro. Isso é consistente com o padrão que o frontend espera via `response.data?.error`.

Trocar todos os `{ status: 400, ... }` dentro do bloco `create_facilitator` por `{ status: 200, ... }`.

**2. Frontend (`FacilitatorDialog.tsx`)**: Como fallback, melhorar o tratamento de `response.error` para tentar extrair o body JSON da resposta original, exibindo a mensagem real ao invés do erro genérico.

### Arquivos

| Arquivo | Ação |
|---|---|
| `supabase/functions/activate-account/index.ts` | Mudar status 400 → 200 no bloco `create_facilitator` |
| `src/components/institution/FacilitatorDialog.tsx` | Melhorar fallback de erro para extrair mensagem do body |

