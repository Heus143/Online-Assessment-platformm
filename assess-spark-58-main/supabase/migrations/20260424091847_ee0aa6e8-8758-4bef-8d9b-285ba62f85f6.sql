
-- 1. Roles enum + user_roles table
CREATE TYPE public.app_role AS ENUM ('teacher', 'student');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer to avoid recursive RLS
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
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

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

CREATE POLICY "Users can view their own role"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- 2. Add role column to profiles for quick display
ALTER TABLE public.profiles ADD COLUMN role public.app_role;

-- 3. Replace handle_new_user to also create role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role public.app_role;
BEGIN
  _role := COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'student');

  INSERT INTO public.profiles (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    _role
  );

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Exams
CREATE TABLE public.exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  exam_date date NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 30,
  syllabus_text text,
  syllabus_pdf_path text,
  status text NOT NULL DEFAULT 'published',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers manage their own exams"
  ON public.exams FOR ALL
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Students can view published exams"
  ON public.exams FOR SELECT
  USING (
    status = 'published'
    AND public.has_role(auth.uid(), 'student')
  );

CREATE TRIGGER set_exams_updated_at
  BEFORE UPDATE ON public.exams
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. Exam questions
CREATE TABLE public.exam_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  question_type text NOT NULL CHECK (question_type IN ('mcq','true_false')),
  prompt text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  correct_answer text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers manage questions of their exams"
  ON public.exam_questions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.exams e WHERE e.id = exam_id AND e.teacher_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.exams e WHERE e.id = exam_id AND e.teacher_id = auth.uid()
  ));

CREATE POLICY "Students view questions of published exams"
  ON public.exam_questions FOR SELECT
  USING (
    public.has_role(auth.uid(), 'student')
    AND EXISTS (SELECT 1 FROM public.exams e WHERE e.id = exam_id AND e.status = 'published')
  );

-- 6. Exam attempts
CREATE TABLE public.exam_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz,
  score integer NOT NULL DEFAULT 0,
  total_questions integer NOT NULL DEFAULT 0,
  warning_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'in_progress',
  cheating_status text,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  announced boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(exam_id, student_id)
);

ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students manage their own attempts"
  ON public.exam_attempts FOR ALL
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Teachers view attempts on their exams"
  ON public.exam_attempts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.exams e WHERE e.id = exam_id AND e.teacher_id = auth.uid()
  ));

CREATE POLICY "Teachers can update attempts on their exams"
  ON public.exam_attempts FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.exams e WHERE e.id = exam_id AND e.teacher_id = auth.uid()
  ));

CREATE TRIGGER set_attempts_updated_at
  BEFORE UPDATE ON public.exam_attempts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 7. Attempt events (warning logs)
CREATE TABLE public.attempt_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.attempt_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students add events to their attempts"
  ON public.attempt_events FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.exam_attempts a WHERE a.id = attempt_id AND a.student_id = auth.uid()
  ));

CREATE POLICY "Students view events of their attempts"
  ON public.attempt_events FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.exam_attempts a WHERE a.id = attempt_id AND a.student_id = auth.uid()
  ));

CREATE POLICY "Teachers view events of their exams' attempts"
  ON public.attempt_events FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.exam_attempts a
    JOIN public.exams e ON e.id = a.exam_id
    WHERE a.id = attempt_id AND e.teacher_id = auth.uid()
  ));

-- 8. Storage bucket for syllabi
INSERT INTO storage.buckets (id, name, public) VALUES ('syllabi', 'syllabi', false);

CREATE POLICY "Authenticated users can read syllabi"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'syllabi' AND auth.role() = 'authenticated');

CREATE POLICY "Teachers upload syllabi to their folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'syllabi'
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND public.has_role(auth.uid(), 'teacher')
  );

CREATE POLICY "Teachers update their own syllabi"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'syllabi'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Teachers delete their own syllabi"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'syllabi'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
