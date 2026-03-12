-- 1. Update RPC to include user_id in student_ranking
CREATE OR REPLACE FUNCTION public.get_facilitator_dashboard_data(_user_id uuid, _start_date timestamp with time zone, _end_date timestamp with time zone)
 RETURNS json
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    SELECT p.id AS user_id, p.full_name, p.xp_total, p.level, fc.name AS class_name
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
    'student_ranking', (SELECT coalesce(json_agg(json_build_object('user_id', user_id, 'full_name', full_name, 'xp_total', xp_total, 'level', level, 'class_name', class_name)), '[]'::json) FROM student_ranking)
  ) INTO result;

  RETURN result;
END;
$function$;

-- 2. Allow facilitators to read xp_log of their class students
CREATE POLICY "Facilitator reads class student xp_log"
ON public.user_xp_log
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'facilitator'::app_role)
  AND EXISTS (
    SELECT 1
    FROM class_members cm1
    JOIN class_members cm2 ON cm1.class_id = cm2.class_id
    WHERE cm1.user_id = auth.uid()
      AND cm1.role = 'facilitator'::app_role
      AND cm2.user_id = user_xp_log.user_id
      AND cm2.role = 'student'::app_role
  )
);