## Plano de Implementação — Plataforma SaaS de Empregabilidade Juvenil (MVP v1.0)

### Fase 1: Base de Dados e Segurança (Supabase)

Criar todas as tabelas com RLS rigoroso para isolamento multi-tenant:

- **institutions** — dados das instituições clientes
- **user_roles** — roles (admin_master, admin_institution, facilitator, student) separados dos perfis
- **profiles** — nome, CPF, avatar, institution_id, XP total, nível
- **classes** — turmas vinculadas a instituições
- **class_members** — alunos e facilitadores alocados às turmas
- **trails** — trilha de empregabilidade (curso completo)
- **modules** — módulos dentro de uma trilha
- **lessons** — aulas dentro de módulos (com ordem e nota mínima)
- **lesson_steps** — passos da aula (vídeo, PDF, teste, material complementar)
- **activities** — testes objetivos e avaliações comportamentais
- **activity_questions** — perguntas das atividades
- **submissions** — respostas/entregas dos alunos
- **user_xp_log** — registro de XP ganho por ação
- **badges** — definição de medalhas
- **user_badges** — medalhas conquistadas por aluno
- **notifications** — alertas in-app
- **extra_activities** — atividades extras criadas por facilitadores

RLS: Cada tabela terá políticas que filtram por `institution_id` usando função `security definer`, garantindo isolamento total entre instituições.

### Fase 2: Autenticação e Onboarding

- Tela de **Login** com CPF + senha (não use email)
- Fluxo de **ativação de conta** para alunos pré-cadastrados (CPF + definição de senha forte)
- Redirecionamento automático por role após login (Admin Master → Dashboard Admin, Aluno → Dashboard Aluno, etc.)
- Tela de **recuperação de senha**

### Fase 3: Tema e Design System

- Implementar **Light Mode**: fundo gelo (`#F8F9FA`), ações em mostarda (`#E5A100`)
- Implementar **Dark Mode**: fundo grafite (`#1E1E2E`), destaques em ouro (`#D4A836`)
- Toggle de tema no header
- Layout **mobile-first** responsivo com sidebar colapsável

### Fase 4: Dashboard Admin Master

- **Visão global**: cards com total de instituições, alunos ativos, taxa de conclusão
- **Gestão de Instituições**: listar, criar, editar instituições
- **Construtor de Trilhas**: interface hierárquica para criar Trilha → Módulos → Aulas → Passos (vídeo/PDF/teste)
- **Relatórios globais**: gráficos de uso por instituição

### Fase 5: Dashboard Admin Instituição

- **Visão da instituição**: métricas de alunos, turmas, engajamento
- **Gestão de Turmas**: CRUD de turmas
- **Gestão de Facilitadores**: cadastro e alocação em turmas
- **Importação em lote**: upload de planilha CSV (CPF + Turma) para matrícula de alunos
- **Relatórios**: % conclusão, notas médias, ranking

### Fase 6: Dashboard Facilitador

- **Minhas Turmas**: lista de turmas atribuídas
- **Avaliação de Alunos**: visualizar entregas, corrigir avaliações comportamentais (escala 0-10)
- **Atividades Extras**: criar atividades exclusivas para turma/aluno
- **Mapa Comportamental**: gráfico radar por aluno

### Fase 7: Dashboard Aluno

- **Minha Trilha**: visualização da trilha com progresso, navegação linear (aula bloqueada se anterior não concluída)
- **Player de Conteúdo**: vídeo embed (YouTube/Vimeo) e leitor de PDF integrado
- **Testes e Atividades**: responder questões múltipla escolha com correção automática
- **Gamificação**: barra de XP e nível, badges conquistados, celebrações visuais (confetes ao completar módulo)
- **Notificações**: alertas de novas atividades, feedbacks e lembretes

### Fase 8: Notificações In-App

- Sistema de notificações com sino no header
- Marcar como lida
- Tipos: nova atividade, feedback recebido, lembrete de prazo, conquista desbloqueada

O escopo será "faseado", implementando uma fase por vez com prévia análise e aprovação humana antes de seguir para a próxima.