
-- RPC 1: Admin Master Dashboard
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_data(_start_date timestamptz, _end_date timestamptz)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  WITH kpi_institutions AS (
    SELECT count(*) AS cnt FROM institutions
  ),
  kpi_students AS (
    SELECT count(*) AS cnt FROM user_roles WHERE role = 'student'
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
    GROUP BY i.id, i.name
    ORDER BY students DESC
    LIMIT 10
  ),
  monthly AS (
    SELECT
      date_trunc('month', p.created_at) AS month_start,
      count(*) AS cnt
    FROM profiles p
    WHERE p.created_at >= date_trunc('month', _start_date)
      AND p.created_at < _end_date
    GROUP BY month_start
    ORDER BY month_start
  ),
  roles_dist AS (
    SELECT role::text, count(*) AS cnt
    FROM user_roles
    GROUP BY role
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
      'trails', (SELECT cnt FROM kpi_trails),
      'completion_pct', (SELECT CASE WHEN total_cnt > 0 THEN round((completed_cnt::numeric / total_cnt) * 100) ELSE 0 END FROM kpi_completion)
    )),
    'students_per_institution', (SELECT coalesce(json_agg(json_build_object('name', name, 'students', students)), '[]'::json) FROM inst_students),
    'monthly_growth', (SELECT coalesce(json_agg(json_build_object('month', to_char(month_start, 'YYYY-MM-DD'), 'count', cnt)), '[]'::json) FROM monthly),
    'roles_distribution', (SELECT coalesce(json_agg(json_build_object('role', role, 'count', cnt)), '[]'::json) FROM roles_dist),
    'top_students', (SELECT coalesce(json_agg(json_build_object('full_name', full_name, 'xp_total', xp_total, 'level', level)), '[]'::json) FROM top_students)
  ) INTO result;

  RETURN result;
END;
$$;

-- RPC 2: Institution Dashboard
CREATE OR REPLACE FUNCTION public.get_institution_dashboard_data(_user_id uuid, _start_date timestamptz, _end_date timestamptz)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _inst_id uuid;
  result json;
BEGIN
  SELECT institution_id INTO _inst_id FROM profiles WHERE id = _user_id;
  IF _inst_id IS NULL THEN
    RETURN json_build_object('kpis', json_build_object('classes',0,'students',0,'facilitators',0,'avg_completion',0),
      'class_reports','[]'::json,'weekly_completions','[]'::json,'top_students','[]'::json);
  END IF;

  WITH inst_classes AS (
    SELECT id, name, trail_id FROM classes WHERE institution_id = _inst_id
  ),
  class_students AS (
    SELECT cm.class_id, cm.user_id
    FROM class_members cm
    JOIN inst_classes ic ON ic.id = cm.class_id
    WHERE cm.role = 'student'
  ),
  class_facilitators AS (
    SELECT DISTINCT cm.user_id
    FROM class_members cm
    JOIN inst_classes ic ON ic.id = cm.class_id
    WHERE cm.role = 'facilitator'
  ),
  class_lesson_counts AS (
    SELECT ic.id AS class_id, ic.name, count(l.id) AS total_lessons,
           array_agg(l.id) AS lesson_ids
    FROM inst_classes ic
    LEFT JOIN modules m ON m.trail_id = ic.trail_id
    LEFT JOIN lessons l ON l.module_id = m.id
    GROUP BY ic.id, ic.name
  ),
  class_completions AS (
    SELECT clc.class_id, clc.name,
      (SELECT count(DISTINCT cs2.user_id) FROM class_students cs2 WHERE cs2.class_id = clc.class_id) AS student_count,
      CASE WHEN clc.total_lessons > 0 AND (SELECT count(*) FROM class_students cs3 WHERE cs3.class_id = clc.class_id) > 0
        THEN round(
          (SELECT count(*)::numeric FROM lesson_progress lp
           JOIN class_students cs4 ON cs4.user_id = lp.user_id AND cs4.class_id = clc.class_id
           WHERE lp.lesson_id = ANY(clc.lesson_ids) AND lp.completed = true
             AND lp.completed_at >= _start_date AND lp.completed_at <= _end_date
          ) / (clc.total_lessons * (SELECT count(*) FROM class_students cs5 WHERE cs5.class_id = clc.class_id)) * 100
        )
        ELSE 0
      END AS completion_pct
    FROM class_lesson_counts clc
  ),
  all_student_ids AS (
    SELECT DISTINCT user_id FROM class_students
  ),
  weekly AS (
    SELECT date_trunc('week', lp.completed_at) AS week_start, count(*) AS completions
    FROM lesson_progress lp
    JOIN all_student_ids asi ON asi.user_id = lp.user_id
    WHERE lp.completed = true
      AND lp.completed_at >= _start_date AND lp.completed_at <= _end_date
    GROUP BY week_start
    ORDER BY week_start
    LIMIT 12
  ),
  top AS (
    SELECT p.full_name, p.xp_total, p.level
    FROM profiles p
    JOIN user_roles ur ON ur.user_id = p.id AND ur.role = 'student'
    WHERE p.institution_id = _inst_id
    ORDER BY p.xp_total DESC
    LIMIT 20
  )
  SELECT json_build_object(
    'kpis', json_build_object(
      'classes', (SELECT count(*) FROM inst_classes),
      'students', (SELECT count(DISTINCT user_id) FROM class_students),
      'facilitators', (SELECT count(*) FROM class_facilitators),
      'avg_completion', (SELECT coalesce(round(avg(completion_pct)), 0) FROM class_completions)
    ),
    'class_reports', (SELECT coalesce(json_agg(json_build_object('name', name, 'student_count', student_count, 'completion_pct', completion_pct)), '[]'::json) FROM class_completions),
    'weekly_completions', (SELECT coalesce(json_agg(json_build_object('week_start', to_char(week_start, 'YYYY-MM-DD'), 'completions', completions)), '[]'::json) FROM weekly),
    'top_students', (SELECT coalesce(json_agg(json_build_object('full_name', full_name, 'xp_total', xp_total, 'level', level)), '[]'::json) FROM top)
  ) INTO result;

  RETURN result;
END;
$$;

-- RPC 3: Facilitator Dashboard
CREATE OR REPLACE FUNCTION public.get_facilitator_dashboard_data(_user_id uuid, _start_date timestamptz, _end_date timestamptz)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  WITH fac_classes AS (
    SELECT c.id, c.name, c.trail_id
    FROM class_members cm
    JOIN classes c ON c.id = cm.class_id
    WHERE cm.user_id = _user_id AND cm.role = 'facilitator'
  ),
  class_students AS (
    SELECT cm.class_id, cm.user_id
    FROM class_members cm
    JOIN fac_classes fc ON fc.id = cm.class_id
    WHERE cm.role = 'student'
  ),
  class_lesson_counts AS (
    SELECT fc.id AS class_id, fc.name, count(l.id) AS total_lessons,
           array_agg(l.id) AS lesson_ids
    FROM fac_classes fc
    LEFT JOIN modules m ON m.trail_id = fc.trail_id
    LEFT JOIN lessons l ON l.module_id = m.id
    GROUP BY fc.id, fc.name
  ),
  class_completions AS (
    SELECT clc.class_id, clc.name,
      CASE WHEN clc.total_lessons > 0 AND (SELECT count(*) FROM class_students cs WHERE cs.class_id = clc.class_id) > 0
        THEN round(
          (SELECT count(*)::numeric FROM lesson_progress lp
           JOIN class_students cs2 ON cs2.user_id = lp.user_id AND cs2.class_id = clc.class_id
           WHERE lp.lesson_id = ANY(clc.lesson_ids) AND lp.completed = true
             AND lp.completed_at >= _start_date AND lp.completed_at <= _end_date
          ) / (clc.total_lessons * (SELECT count(*) FROM class_students cs3 WHERE cs3.class_id = clc.class_id)) * 100
        )
        ELSE 0
      END AS completion_pct
    FROM class_lesson_counts clc
  ),
  student_ranking AS (
    SELECT p.full_name, p.xp_total, p.level, fc.name AS class_name
    FROM class_students cs
    JOIN profiles p ON p.id = cs.user_id
    JOIN fac_classes fc ON fc.id = cs.class_id
    ORDER BY p.xp_total DESC
  ),
  extras_count AS (
    SELECT count(*) AS cnt FROM extra_activities WHERE created_by = _user_id
  )
  SELECT json_build_object(
    'kpis', json_build_object(
      'classes', (SELECT count(*) FROM fac_classes),
      'students', (SELECT count(DISTINCT user_id) FROM class_students),
      'extras', (SELECT cnt FROM extras_count),
      'avg_completion', (SELECT coalesce(round(avg(completion_pct)), 0) FROM class_completions)
    ),
    'class_completions', (SELECT coalesce(json_agg(json_build_object('name', name, 'completion', completion_pct)), '[]'::json) FROM class_completions),
    'student_ranking', (SELECT coalesce(json_agg(json_build_object('full_name', full_name, 'xp_total', xp_total, 'level', level, 'class_name', class_name)), '[]'::json) FROM student_ranking)
  ) INTO result;

  RETURN result;
END;
$$;
