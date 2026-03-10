
-- Drop the pre-existing FK that conflicts
ALTER TABLE public.lesson_steps DROP CONSTRAINT IF EXISTS fk_lesson_steps_activity;

-- Add all FK constraints
ALTER TABLE public.profiles ADD CONSTRAINT fk_profiles_user FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.profiles ADD CONSTRAINT fk_profiles_institution FOREIGN KEY (institution_id) REFERENCES public.institutions(id) ON DELETE SET NULL NOT VALID;
ALTER TABLE public.classes ADD CONSTRAINT fk_classes_institution FOREIGN KEY (institution_id) REFERENCES public.institutions(id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.classes ADD CONSTRAINT fk_classes_trail FOREIGN KEY (trail_id) REFERENCES public.trails(id) ON DELETE SET NULL NOT VALID;
ALTER TABLE public.class_members ADD CONSTRAINT fk_class_members_class FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.class_members ADD CONSTRAINT fk_class_members_user FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.modules ADD CONSTRAINT fk_modules_trail FOREIGN KEY (trail_id) REFERENCES public.trails(id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.lessons ADD CONSTRAINT fk_lessons_module FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.lesson_steps ADD CONSTRAINT fk_lesson_steps_lesson FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.lesson_steps ADD CONSTRAINT fk_lesson_steps_activity FOREIGN KEY (activity_id) REFERENCES public.activities(id) ON DELETE SET NULL NOT VALID;
ALTER TABLE public.lesson_progress ADD CONSTRAINT fk_lesson_progress_lesson FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.lesson_progress ADD CONSTRAINT fk_lesson_progress_user FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.activity_questions ADD CONSTRAINT fk_activity_questions_activity FOREIGN KEY (activity_id) REFERENCES public.activities(id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.submissions ADD CONSTRAINT fk_submissions_activity FOREIGN KEY (activity_id) REFERENCES public.activities(id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.submissions ADD CONSTRAINT fk_submissions_lesson FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE SET NULL NOT VALID;
ALTER TABLE public.submissions ADD CONSTRAINT fk_submissions_user FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.user_roles ADD CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.user_badges ADD CONSTRAINT fk_user_badges_user FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.user_badges ADD CONSTRAINT fk_user_badges_badge FOREIGN KEY (badge_id) REFERENCES public.badges(id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.user_xp_log ADD CONSTRAINT fk_user_xp_log_user FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.extra_activities ADD CONSTRAINT fk_extra_activities_class FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.extra_activities ADD CONSTRAINT fk_extra_activities_created_by FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.extra_activities ADD CONSTRAINT fk_extra_activities_target_user FOREIGN KEY (target_user_id) REFERENCES public.profiles(id) ON DELETE SET NULL NOT VALID;
ALTER TABLE public.notifications ADD CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.trails ADD CONSTRAINT fk_trails_created_by FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL NOT VALID;
ALTER TABLE public.activities ADD CONSTRAINT fk_activities_created_by FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL NOT VALID;

-- Validate all
ALTER TABLE public.profiles VALIDATE CONSTRAINT fk_profiles_user;
ALTER TABLE public.profiles VALIDATE CONSTRAINT fk_profiles_institution;
ALTER TABLE public.classes VALIDATE CONSTRAINT fk_classes_institution;
ALTER TABLE public.classes VALIDATE CONSTRAINT fk_classes_trail;
ALTER TABLE public.class_members VALIDATE CONSTRAINT fk_class_members_class;
ALTER TABLE public.class_members VALIDATE CONSTRAINT fk_class_members_user;
ALTER TABLE public.modules VALIDATE CONSTRAINT fk_modules_trail;
ALTER TABLE public.lessons VALIDATE CONSTRAINT fk_lessons_module;
ALTER TABLE public.lesson_steps VALIDATE CONSTRAINT fk_lesson_steps_lesson;
ALTER TABLE public.lesson_steps VALIDATE CONSTRAINT fk_lesson_steps_activity;
ALTER TABLE public.lesson_progress VALIDATE CONSTRAINT fk_lesson_progress_lesson;
ALTER TABLE public.lesson_progress VALIDATE CONSTRAINT fk_lesson_progress_user;
ALTER TABLE public.activity_questions VALIDATE CONSTRAINT fk_activity_questions_activity;
ALTER TABLE public.submissions VALIDATE CONSTRAINT fk_submissions_activity;
ALTER TABLE public.submissions VALIDATE CONSTRAINT fk_submissions_lesson;
ALTER TABLE public.submissions VALIDATE CONSTRAINT fk_submissions_user;
ALTER TABLE public.user_roles VALIDATE CONSTRAINT fk_user_roles_user;
ALTER TABLE public.user_badges VALIDATE CONSTRAINT fk_user_badges_user;
ALTER TABLE public.user_badges VALIDATE CONSTRAINT fk_user_badges_badge;
ALTER TABLE public.user_xp_log VALIDATE CONSTRAINT fk_user_xp_log_user;
ALTER TABLE public.extra_activities VALIDATE CONSTRAINT fk_extra_activities_class;
ALTER TABLE public.extra_activities VALIDATE CONSTRAINT fk_extra_activities_created_by;
ALTER TABLE public.extra_activities VALIDATE CONSTRAINT fk_extra_activities_target_user;
ALTER TABLE public.notifications VALIDATE CONSTRAINT fk_notifications_user;
ALTER TABLE public.trails VALIDATE CONSTRAINT fk_trails_created_by;
ALTER TABLE public.activities VALIDATE CONSTRAINT fk_activities_created_by;
