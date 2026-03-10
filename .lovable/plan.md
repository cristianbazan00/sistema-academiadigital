

## Adicionar Foreign Keys para Integridade Referencial

Baseado no schema atual, nenhuma tabela possui FK constraints. Vou adicionar todas as relações lógicas existentes.

### Foreign Keys a criar

| Tabela | Coluna | Referência | ON DELETE |
|---|---|---|---|
| `profiles` | `id` | `auth.users(id)` | CASCADE |
| `profiles` | `institution_id` | `institutions(id)` | SET NULL |
| `classes` | `institution_id` | `institutions(id)` | CASCADE |
| `classes` | `trail_id` | `trails(id)` | SET NULL |
| `class_members` | `class_id` | `classes(id)` | CASCADE |
| `class_members` | `user_id` | `profiles(id)` | CASCADE |
| `modules` | `trail_id` | `trails(id)` | CASCADE |
| `lessons` | `module_id` | `modules(id)` | CASCADE |
| `lesson_steps` | `lesson_id` | `lessons(id)` | CASCADE |
| `lesson_steps` | `activity_id` | `activities(id)` | SET NULL |
| `lesson_progress` | `lesson_id` | `lessons(id)` | CASCADE |
| `lesson_progress` | `user_id` | `profiles(id)` | CASCADE |
| `activity_questions` | `activity_id` | `activities(id)` | CASCADE |
| `submissions` | `activity_id` | `activities(id)` | CASCADE |
| `submissions` | `lesson_id` | `lessons(id)` | SET NULL |
| `submissions` | `user_id` | `profiles(id)` | CASCADE |
| `user_roles` | `user_id` | `auth.users(id)` | CASCADE |
| `user_badges` | `user_id` | `profiles(id)` | CASCADE |
| `user_badges` | `badge_id` | `badges(id)` | CASCADE |
| `user_xp_log` | `user_id` | `profiles(id)` | CASCADE |
| `extra_activities` | `class_id` | `classes(id)` | CASCADE |
| `extra_activities` | `created_by` | `profiles(id)` | CASCADE |
| `extra_activities` | `target_user_id` | `profiles(id)` | SET NULL |
| `notifications` | `user_id` | `profiles(id)` | CASCADE |
| `trails` | `created_by` | `profiles(id)` | SET NULL |
| `activities` | `created_by` | `profiles(id)` | SET NULL |

### Implementação

Uma única migration SQL usando `ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY` com `NOT VALID` para não bloquear a tabela durante validação de dados existentes, seguido de `VALIDATE CONSTRAINT` para cada uma.

Nenhuma mudança no frontend — apenas integridade no banco.

