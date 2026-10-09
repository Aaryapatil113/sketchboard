CREATE TYPE public.app_role AS ENUM ('admin', 'student');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles readable by signed-in users" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Signup: enforce domain, create profile + role. First user becomes admin.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE is_first boolean;
BEGIN
  IF NEW.email IS NULL OR lower(NEW.email) NOT LIKE '%@northeastern.edu' THEN
    RAISE EXCEPTION 'Only @northeastern.edu email addresses can sign up';
  END IF;
  SELECT NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') INTO is_first;
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), split_part(NEW.email, '@', 1)));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student');
  IF is_first THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.weeks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_number int NOT NULL UNIQUE,
  title text NOT NULL,
  prompt text NOT NULL DEFAULT '',
  submission_deadline timestamptz NOT NULL,
  voting_deadline timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (voting_deadline >= submission_deadline)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weeks TO authenticated;
GRANT ALL ON public.weeks TO service_role;
ALTER TABLE public.weeks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Weeks readable" ON public.weeks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins insert weeks" ON public.weeks FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update weeks" ON public.weeks FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete weeks" ON public.weeks FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id uuid NOT NULL REFERENCES public.weeks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 100),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 300),
  alt_text text NOT NULL CHECK (char_length(alt_text) BETWEEN 1 AND 300),
  image_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (week_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.submissions TO authenticated;
GRANT ALL ON public.submissions TO service_role;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Submissions readable" ON public.submissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Students insert own" ON public.submissions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Students update own" ON public.submissions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Students delete own" ON public.submissions FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.validate_submission()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE dl timestamptz;
BEGIN
  IF TG_OP = 'DELETE' THEN
    SELECT submission_deadline INTO dl FROM public.weeks WHERE id = OLD.week_id;
    IF now() > dl THEN RAISE EXCEPTION 'The submission deadline has passed'; END IF;
    RETURN OLD;
  END IF;
  SELECT submission_deadline INTO dl FROM public.weeks WHERE id = NEW.week_id;
  IF dl IS NULL THEN RAISE EXCEPTION 'Week not found'; END IF;
  IF now() > dl THEN RAISE EXCEPTION 'The submission deadline has passed'; END IF;
  IF TG_OP = 'UPDATE' THEN
    NEW.week_id := OLD.week_id;
    NEW.user_id := OLD.user_id;
    NEW.created_at := OLD.created_at;
    NEW.updated_at := now();
  ELSE
    NEW.created_at := now();
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER submissions_validate BEFORE INSERT OR UPDATE OR DELETE ON public.submissions FOR EACH ROW EXECUTE FUNCTION public.validate_submission();

CREATE TABLE public.likes (
  submission_id uuid NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (submission_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.likes TO authenticated;
GRANT ALL ON public.likes TO service_role;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Likes readable" ON public.likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users like as self" ON public.likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users unlike own" ON public.likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.validate_like()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE owner uuid; vdl timestamptz; sid uuid;
BEGIN
  sid := CASE WHEN TG_OP = 'DELETE' THEN OLD.submission_id ELSE NEW.submission_id END;
  SELECT s.user_id, w.voting_deadline INTO owner, vdl
    FROM public.submissions s JOIN public.weeks w ON w.id = s.week_id WHERE s.id = sid;
  -- Allow cascade deletes when the submission/week itself is gone
  IF owner IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;
  IF now() > vdl THEN RAISE EXCEPTION 'Voting has closed for this week'; END IF;
  IF TG_OP = 'INSERT' AND owner = NEW.user_id THEN RAISE EXCEPTION 'You cannot like your own sketch'; END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;
CREATE TRIGGER likes_validate BEFORE INSERT OR DELETE ON public.likes FOR EACH ROW EXECUTE FUNCTION public.validate_like();

-- Storage policies: files live under <user_id>/...
CREATE POLICY "Sketch images public read" ON storage.objects FOR SELECT USING (bucket_id = 'sketches');
CREATE POLICY "Users upload own sketches" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'sketches' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users update own sketches" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'sketches' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users delete own sketches" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'sketches' AND (storage.foldername(name))[1] = auth.uid()::text);
