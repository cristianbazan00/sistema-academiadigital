

## Fase 7: Dashboard do Aluno — Trilha, Player, Testes e Gamificação

### Visão Geral
Transformar o dashboard estático do aluno em uma experiência completa: visualização da trilha atribuída, player de conteúdo (vídeo/PDF/texto), quizzes interativos, tracking de progresso, sistema de XP com log, badges conquistados e confetes ao completar aulas.

### Arquivos a Criar

| Arquivo | Descrição |
|---|---|
| `src/pages/student/StudentTrail.tsx` | Página da trilha com módulos e aulas (accordion) mostrando progresso por aula |
| `src/pages/student/StudentLesson.tsx` | Player de aula: renderiza passos sequenciais (vídeo embed, PDF link, quiz, texto), com navegação passo-a-passo |
| `src/components/student/StepRenderer.tsx` | Renderiza um passo conforme `step_type`: iframe para vídeo, link/embed para PDF, formulário para quiz |
| `src/components/student/QuizPlayer.tsx` | Formulário interativo de quiz: exibe questões, coleta respostas, calcula score, submete e concede XP |
| `src/components/student/BadgesList.tsx` | Lista de badges conquistados pelo aluno (usa `user_badges` + `badges`) |
| `src/components/student/XpAnimation.tsx` | Componente de animação de XP ganho (+50 XP) com fade-in |
| `src/components/student/ConfettiEffect.tsx` | Efeito de confetes ao completar uma aula (canvas-confetti via CSS animations) |

### Arquivos a Modificar

| Arquivo | Mudança |
|---|---|
| `src/pages/student/StudentDashboard.tsx` | Buscar trilha real via classes → trails, mostrar progresso geral, listar badges, link para trilha |
| `src/components/DashboardLayout.tsx` | Expandir nav do student: Dashboard, Minha Trilha, Conquistas |
| `src/App.tsx` | Adicionar rotas `/student/trail`, `/student/lesson/:lessonId` protegidas por `student` |

### Fluxo de Dados

1. **Descobrir trilha do aluno**: `class_members` (user_id) → `classes` (class_id) → buscar trilha publicada associada (precisamos vincular classe a trilha — ver abaixo)
2. **Carregar estrutura**: `modules` → `lessons` → `lesson_steps` para a trilha
3. **Progresso**: `lesson_progress` filtrado por `user_id` para marcar aulas completas
4. **Quiz**: `lesson_steps` com `activity_id` → `activity_questions` → submeter em `submissions` → conceder XP em `user_xp_log` + atualizar `profiles.xp_total`
5. **Badges**: `user_badges` join `badges` para listar conquistas

### Migração Necessária

A tabela `classes` não tem coluna `trail_id` para vincular uma turma a uma trilha. Precisamos adicionar:

```sql
ALTER TABLE public.classes ADD COLUMN trail_id uuid REFERENCES public.trails(id);
```

Isso permite que o admin da instituição atribua uma trilha a cada turma, e o aluno descubra sua trilha via sua turma.

### Lógica de Gamificação (client-side)

- Ao completar quiz com score >= `min_score` da aula:
  - Inserir em `lesson_progress` (completed = true, score)
  - Inserir em `submissions` (answers, score)
  - Inserir em `user_xp_log` (+50 XP por aula, +20 XP por quiz perfeito)
  - Atualizar `profiles.xp_total` e recalcular `level` (level = floor(xp/200) + 1)
  - Disparar confetes
- Ao atingir marcos de XP: verificar critérios de badges e inserir em `user_badges`

### Detalhes de Implementação

**StudentDashboard**: Mostra XP/nível (já existe), progresso geral da trilha (% aulas completas), badges recentes, e botão "Continuar Trilha" que leva à próxima aula incompleta.

**StudentTrail**: Accordion de módulos. Cada módulo lista aulas com ícone de check (completa) ou lock (bloqueada — aula anterior não completa). Clicar em aula disponível navega para `/student/lesson/:id`.

**StudentLesson**: Stepper horizontal mostrando passos. Renderiza um passo por vez via `StepRenderer`. Botão "Próximo" avança. No último passo, marca `lesson_progress` como completo e dispara confetes.

**QuizPlayer**: Renderiza questões de `activity_questions`. Ao submeter, calcula score (% corretas), salva em `submissions`, concede XP se aprovado.

**ConfettiEffect**: Implementado com CSS animations (partículas absolutas com keyframes aleatórios), sem dependência externa.

### Sem Edge Functions Necessárias
Toda a lógica roda client-side usando as tabelas existentes com RLS já configurado (users manage own progress/submissions/xp).

