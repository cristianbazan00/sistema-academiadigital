
-- 1. Enum para roles
CREATE TYPE public.app_role AS ENUM ('admin_master', 'admin_institution', 'facilitator', 'student');

-- 2. Enum para tipo de passo de aula
CREATE TYPE public.lesson_step_type AS ENUM ('video', 'pdf', 'quiz', 'behavioral_assessment', 'supplementary');

-- 3. Enum para tipo de atividade
CREATE TYPE public.activity_type AS ENUM ('multiple_choice', 'behavioral_scale');

-- 4. Enum para tipo de notificação
CREATE TYPE public.notification_type AS ENUM ('new_activity', 'feedback', 'deadline_reminder', 'badge_unlocked', 'general');

-- 5. Institutions
CREATE TABLE public.institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;

-- 6. Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  cpf TEXT UNIQUE,
  avatar_url TEXT,
  institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
  xp_total INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 7. User roles (separado de profiles)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 8. Classes (turmas)
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- 9. Class members
CREATE TABLE public.class_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL CHECK (role IN ('facilitator', 'student')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(class_id, user_id)
);
ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;

-- 10. Trails (trilhas)
CREATE TABLE public.trails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.trails ENABLE ROW LEVEL SECURITY;

-- 11. Modules
CREATE TABLE public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trail_id UUID NOT NULL REFERENCES public.trails(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

-- 12. Lessons
CREATE TABLE public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  min_score NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- 13. Lesson steps
CREATE TABLE public.lesson_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  step_type public.lesson_step_type NOT NULL,
  title TEXT NOT NULL,
  content_url TEXT,
  content_body TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  activity_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.lesson_steps ENABLE ROW LEVEL SECURITY;

-- 14. Activities
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  activity_type public.activity_type NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Add FK from lesson_steps to activities
ALTER TABLE public.lesson_steps
  ADD CONSTRAINT fk_lesson_steps_activity
  FOREIGN KEY (activity_id) REFERENCES public.activities(id) ON DELETE SET NULL;

-- 15. Activity questions
CREATE TABLE public.activity_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  options JSONB,
  correct_answer TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);
ALTER TABLE public.activity_questions ENABLE ROW LEVEL SECURITY;

-- 16. Submissions
CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  answers JSONB NOT NULL DEFAULT '{}',
  score NUMERIC,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- 17. User XP log
CREATE TABLE public.user_xp_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  xp_amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  reference_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_xp_log ENABLE ROW LEVEL SECURITY;

-- 18. Badges
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  criteria JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

-- 19. User badges
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- 20. Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type public.notification_type NOT NULL DEFAULT 'general',
  title TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  reference_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 21. Extra activities (facilitator-created)
CREATE TABLE public.extra_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.extra_activities ENABLE ROW LEVEL SECURITY;

-- 22. Lesson progress (track per-user lesson completion)
CREATE TABLE public.lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  score NUMERIC,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, lesson_id)
);
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SECURITY DEFINER FUNCTIONS
-- ============================================================

-- Function to check role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to get user institution_id
CREATE OR REPLACE FUNCTION public.get_user_institution_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT institution_id FROM public.profiles WHERE id = _user_id
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- INSTITUTIONS
CREATE POLICY "Admin master full access" ON public.institutions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin_master'))
  WITH CHECK (public.has_role(auth.uid(), 'admin_master'));

CREATE POLICY "Users see own institution" ON public.institutions
  FOR SELECT TO authenticated
  USING (id = public.get_user_institution_id(auth.uid()));

-- PROFILES
CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admin master reads all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin_master'));

CREATE POLICY "Admin institution reads institution profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin_institution')
    AND institution_id = public.get_user_institution_id(auth.uid())
  );

CREATE POLICY "Insert own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- USER ROLES
CREATE POLICY "Admin master manages roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin_master'))
  WITH CHECK (public.has_role(auth.uid(), 'admin_master'));

CREATE POLICY "Users read own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admin institution manages institution roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin_institution')
    AND (
      SELECT institution_id FROM public.profiles WHERE id = user_roles.user_id
    ) = public.get_user_institution_id(auth.uid())
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin_institution')
    AND (
      SELECT institution_id FROM public.profiles WHERE id = user_roles.user_id
    ) = public.get_user_institution_id(auth.uid())
  );

-- CLASSES
CREATE POLICY "Admin master full access classes" ON public.classes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin_master'))
  WITH CHECK (public.has_role(auth.uid(), 'admin_master'));

CREATE POLICY "Admin institution manages own classes" ON public.classes
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin_institution')
    AND institution_id = public.get_user_institution_id(auth.uid())
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin_institution')
    AND institution_id = public.get_user_institution_id(auth.uid())
  );

CREATE POLICY "Members see their classes" ON public.classes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.class_members
      WHERE class_id = classes.id AND user_id = auth.uid()
    )
  );

-- CLASS MEMBERS
CREATE POLICY "Admin master full access class_members" ON public.class_members
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin_master'))
  WITH CHECK (public.has_role(auth.uid(), 'admin_master'));

CREATE POLICY "Admin institution manages class members" ON public.class_members
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin_institution')
    AND (
      SELECT institution_id FROM public.classes WHERE id = class_members.class_id
    ) = public.get_user_institution_id(auth.uid())
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin_institution')
    AND (
      SELECT institution_id FROM public.classes WHERE id = class_members.class_id
    ) = public.get_user_institution_id(auth.uid())
  );

CREATE POLICY "Users see own memberships" ON public.class_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- TRAILS (global content, created by admin_master)
CREATE POLICY "Admin master manages trails" ON public.trails
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin_master'))
  WITH CHECK (public.has_role(auth.uid(), 'admin_master'));

CREATE POLICY "Authenticated read published trails" ON public.trails
  FOR SELECT TO authenticated
  USING (is_published = true);

-- MODULES
CREATE POLICY "Admin master manages modules" ON public.modules
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin_master'))
  WITH CHECK (public.has_role(auth.uid(), 'admin_master'));

CREATE POLICY "Authenticated read modules" ON public.modules
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.trails WHERE id = modules.trail_id AND is_published = true)
  );

-- LESSONS
CREATE POLICY "Admin master manages lessons" ON public.lessons
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin_master'))
  WITH CHECK (public.has_role(auth.uid(), 'admin_master'));

CREATE POLICY "Authenticated read lessons" ON public.lessons
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.modules m
      JOIN public.trails t ON t.id = m.trail_id
      WHERE m.id = lessons.module_id AND t.is_published = true
    )
  );

-- LESSON STEPS
CREATE POLICY "Admin master manages lesson_steps" ON public.lesson_steps
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin_master'))
  WITH CHECK (public.has_role(auth.uid(), 'admin_master'));

CREATE POLICY "Authenticated read lesson_steps" ON public.lesson_steps
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.modules m ON m.id = l.module_id
      JOIN public.trails t ON t.id = m.trail_id
      WHERE l.id = lesson_steps.lesson_id AND t.is_published = true
    )
  );

-- ACTIVITIES
CREATE POLICY "Admin master manages activities" ON public.activities
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin_master'))
  WITH CHECK (public.has_role(auth.uid(), 'admin_master'));

CREATE POLICY "Authenticated read activities" ON public.activities
  FOR SELECT TO authenticated
  USING (true);

-- ACTIVITY QUESTIONS
CREATE POLICY "Admin master manages questions" ON public.activity_questions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin_master'))
  WITH CHECK (public.has_role(auth.uid(), 'admin_master'));

CREATE POLICY "Authenticated read questions" ON public.activity_questions
  FOR SELECT TO authenticated
  USING (true);

-- SUBMISSIONS
CREATE POLICY "Users manage own submissions" ON public.submissions
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin master reads all submissions" ON public.submissions
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin_master'));

CREATE POLICY "Facilitator reads class submissions" ON public.submissions
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'facilitator')
    AND EXISTS (
      SELECT 1 FROM public.class_members cm1
      JOIN public.class_members cm2 ON cm1.class_id = cm2.class_id
      WHERE cm1.user_id = auth.uid() AND cm1.role = 'facilitator'
      AND cm2.user_id = submissions.user_id AND cm2.role = 'student'
    )
  );

-- USER XP LOG
CREATE POLICY "Users read own xp" ON public.user_xp_log
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System inserts xp" ON public.user_xp_log
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- BADGES
CREATE POLICY "Anyone reads badges" ON public.badges
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admin master manages badges" ON public.badges
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin_master'))
  WITH CHECK (public.has_role(auth.uid(), 'admin_master'));

-- USER BADGES
CREATE POLICY "Users read own badges" ON public.user_badges
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System inserts badges" ON public.user_badges
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- NOTIFICATIONS
CREATE POLICY "Users manage own notifications" ON public.notifications
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- EXTRA ACTIVITIES
CREATE POLICY "Facilitator manages own extras" ON public.extra_activities
  FOR ALL TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Students see targeted extras" ON public.extra_activities
  FOR SELECT TO authenticated
  USING (
    target_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.class_members
      WHERE class_id = extra_activities.class_id AND user_id = auth.uid()
    )
  );

-- LESSON PROGRESS
CREATE POLICY "Users manage own progress" ON public.lesson_progress
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Facilitator reads class progress" ON public.lesson_progress
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'facilitator')
    AND EXISTS (
      SELECT 1 FROM public.class_members cm1
      JOIN public.class_members cm2 ON cm1.class_id = cm2.class_id
      WHERE cm1.user_id = auth.uid() AND cm1.role = 'facilitator'
      AND cm2.user_id = lesson_progress.user_id AND cm2.role = 'student'
    )
  );

CREATE POLICY "Admin master reads all progress" ON public.lesson_progress
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin_master'));
