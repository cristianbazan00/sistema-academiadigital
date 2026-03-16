

## Visão Completa do Conteúdo para o Facilitador

### Problema
Atualmente o `TrailContentSection` no dashboard do facilitador mostra apenas os **títulos** dos módulos e aulas. O facilitador precisa ver o conteúdo completo (textos, vídeos, PDFs, perguntas do quiz) para se preparar e propor intervenções.

### Solução
Criar uma página dedicada `/facilitator/trail` onde o facilitador navega pela estrutura completa da trilha e visualiza o conteúdo de cada aula em modo leitura (sem submissão de quiz, sem registro de progresso).

### Arquivos

**Novo: `src/pages/facilitator/FacilitatorTrailView.tsx`**
- Carrega turmas do facilitador → classes com trail_id → módulos → aulas
- Exibe accordion de módulos; ao clicar numa aula, carrega os `lesson_steps` com `content_body`, `content_url`, `activity_id`
- Para cada passo, renderiza o conteúdo completo:
  - `supplementary`: texto HTML renderizado + link de material
  - `video`: iframe embed
  - `pdf`: link para abrir
  - `quiz`: exibe as perguntas e opções (somente leitura, mostrando a resposta correta destacada) — sem botão de enviar
- Usa componentes UI existentes (Card, Accordion, Badge por tipo de passo)

**Editar: `src/components/DashboardLayout.tsx`**
- Adicionar link "Conteúdo da Trilha" (ícone BookOpen) no nav do facilitador

**Editar: `src/App.tsx`**
- Adicionar rota `/facilitator/trail` protegida para facilitador

**Migração SQL: RLS para facilitador ler lesson_steps**
- A política atual de `lesson_steps` só permite leitura se a trilha for publicada. Adicionar política para facilitadores lerem steps de trilhas vinculadas às suas turmas (mesmo se não publicadas):
```sql
CREATE POLICY "Facilitator reads class trail steps"
ON lesson_steps FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'facilitator') AND EXISTS (
    SELECT 1 FROM lessons l
    JOIN modules m ON m.id = l.module_id
    JOIN classes c ON c.trail_id = m.trail_id
    JOIN class_members cm ON cm.class_id = c.id
    WHERE l.id = lesson_steps.lesson_id
      AND cm.user_id = auth.uid()
      AND cm.role = 'facilitator'
  )
);
```
- Mesma política para `activity_questions` (facilitador já pode ler via política existente pois é SELECT para authenticated = true).

### Sem impacto no fluxo do aluno — página exclusiva do facilitador em modo somente leitura.

