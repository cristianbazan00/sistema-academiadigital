

## Limpar Todas as Tabelas (Manter Admin Master)

O Admin Master (`ea4abe82-2298-424b-8b48-b2a605189fcb`) será preservado. Todos os demais dados serão removidos.

### Ordem de Limpeza (respeitando FKs)

| Passo | Tabela | Ação |
|---|---|---|
| 1 | `notifications` | DELETE ALL |
| 2 | `user_xp_log` | DELETE ALL |
| 3 | `user_badges` | DELETE ALL |
| 4 | `submissions` | DELETE ALL |
| 5 | `lesson_progress` | DELETE ALL |
| 6 | `extra_activities` | DELETE ALL |
| 7 | `class_members` | DELETE ALL |
| 8 | `classes` | DELETE ALL |
| 9 | `lesson_steps` | DELETE ALL |
| 10 | `activity_questions` | DELETE ALL |
| 11 | `activities` | DELETE ALL |
| 12 | `lessons` | DELETE ALL |
| 13 | `modules` | DELETE ALL |
| 14 | `trails` | DELETE ALL |
| 15 | `user_roles` | DELETE WHERE user_id != admin_master |
| 16 | `profiles` | DELETE WHERE id != admin_master |
| 17 | `institutions` | DELETE ALL |
| 18 | Auth users | Deletar via Edge Function todos os auth.users exceto admin_master |

### Implementação

1. **Edge Function `cleanup-platform`**: Uma função temporária que usa service_role para deletar dados de todas as tabelas na ordem correta e remover auth users extras via `supabase.auth.admin.deleteUser()`.

2. **Invocar a função** uma vez para executar a limpeza.

3. **Remover a função** após uso.

Nenhuma alteração de schema -- apenas remoção de dados.

