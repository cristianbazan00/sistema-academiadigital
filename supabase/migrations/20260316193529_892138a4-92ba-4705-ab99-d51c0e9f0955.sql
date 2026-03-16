
-- Allow facilitators to read lesson_steps for trails assigned to their classes
CREATE POLICY "Facilitator reads class trail steps"
ON public.lesson_steps FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'facilitator'::app_role) AND EXISTS (
    SELECT 1 FROM public.lessons l
    JOIN public.modules m ON m.id = l.module_id
    JOIN public.classes c ON c.trail_id = m.trail_id
    JOIN public.class_members cm ON cm.class_id = c.id
    WHERE l.id = lesson_steps.lesson_id
      AND cm.user_id = auth.uid()
      AND cm.role = 'facilitator'::app_role
  )
);

-- Allow facilitators to read trails (even unpublished) assigned to their classes
CREATE POLICY "Facilitator reads class trails"
ON public.trails FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'facilitator'::app_role) AND EXISTS (
    SELECT 1 FROM public.classes c
    JOIN public.class_members cm ON cm.class_id = c.id
    WHERE c.trail_id = trails.id
      AND cm.user_id = auth.uid()
      AND cm.role = 'facilitator'::app_role
  )
);

-- Allow facilitators to read modules of trails assigned to their classes
CREATE POLICY "Facilitator reads class trail modules"
ON public.modules FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'facilitator'::app_role) AND EXISTS (
    SELECT 1 FROM public.classes c
    JOIN public.class_members cm ON cm.class_id = c.id
    WHERE c.trail_id = modules.trail_id
      AND cm.user_id = auth.uid()
      AND cm.role = 'facilitator'::app_role
  )
);

-- Allow facilitators to read lessons of trails assigned to their classes
CREATE POLICY "Facilitator reads class trail lessons"
ON public.lessons FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'facilitator'::app_role) AND EXISTS (
    SELECT 1 FROM public.modules m
    JOIN public.classes c ON c.trail_id = m.trail_id
    JOIN public.class_members cm ON cm.class_id = c.id
    WHERE m.id = lessons.module_id
      AND cm.user_id = auth.uid()
      AND cm.role = 'facilitator'::app_role
  )
);
