CREATE OR REPLACE FUNCTION public.get_admin_dashboard_data(_start_date timestamp with time zone, _end_date timestamp with time zone)
 RETURNS json
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result json;
BEGIN
  WITH kpi_institutions AS (
    SELECT count(*) AS cnt FROM institutions
  ),
  kpi_students AS (
    SELECT count(*) AS cnt FROM user_roles WHERE role = 'student'
  ),
  kpi_facilitators AS (
    SELECT count(*) AS cnt FROM user_roles WHERE role = 'facilitator'
  ),
  kpi_trails AS (
    SELECT count(*) AS cnt FROM trails
  ),
  kpi_completion AS (
    SELECT
      count(*) FILTER (WHERE completed = true) AS completed_cnt,
      count(*) AS total_cnt
    FROM lesson_progress
    WHERE completed_at >= _start_date AND completed_at <= _end_date
  ),
  inst_students AS (
    SELECT i.name, count(p.id) AS students
    FROM institutions i
    LEFT JOIN profiles p ON p.institution_id = i.id
      AND p.created_at >= _start_date AND p.created_at <= _end_date
      AND EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = p.id AND ur.role = 'student')
    GROUP BY i.id, i.name
    ORDER BY students DESC
    LIMIT 10
  ),
  monthly AS (
    SELECT
      date_trunc('month', p.created_at) AS month_start,
      count(*) AS cnt
    FROM profiles p
    JOIN user_roles ur ON ur.user_id = p.id AND ur.role = 'student'
    WHERE p.created_at >= date_trunc('month', _start_date)
      AND p.created_at < _end_date
    GROUP BY month_start
    ORDER BY month_start
  ),
  classes_per_inst AS (
    SELECT i.name, count(c.id) AS classes
    FROM institutions i
    LEFT JOIN classes c ON c.institution_id = i.id
    GROUP BY i.id, i.name
    ORDER BY classes DESC
    LIMIT 10
  ),
  top_students AS (
    SELECT p.full_name, p.xp_total, p.level
    FROM profiles p
    JOIN user_roles ur ON ur.user_id = p.id AND ur.role = 'student'
    ORDER BY p.xp_total DESC
    LIMIT 20
  )
  SELECT json_build_object(
    'kpis', (SELECT json_build_object(
      'institutions', (SELECT cnt FROM kpi_institutions),
      'students', (SELECT cnt FROM kpi_students),
      'facilitators', (SELECT cnt FROM kpi_facilitators),
      'trails', (SELECT cnt FROM kpi_trails),
      'completion_pct', (SELECT CASE WHEN total_cnt > 0 THEN round((completed_cnt::numeric / total_cnt) * 100) ELSE 0 END FROM kpi_completion)
    )),
    'students_per_institution', (SELECT coalesce(json_agg(json_build_object('name', name, 'students', students)), '[]'::json) FROM inst_students),
    'monthly_growth', (SELECT coalesce(json_agg(json_build_object('month', to_char(month_start, 'YYYY-MM-DD'), 'count', cnt)), '[]'::json) FROM monthly),
    'classes_per_institution', (SELECT coalesce(json_agg(json_build_object('name', name, 'classes', classes)), '[]'::json) FROM classes_per_inst),
    'top_students', (SELECT coalesce(json_agg(json_build_object('full_name', full_name, 'xp_total', xp_total, 'level', level)), '[]'::json) FROM top_students)
  ) INTO result;

  RETURN result;
END;
$function$;