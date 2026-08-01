
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM anon;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role); $$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

-- Recreate policies against private.has_role
DROP POLICY IF EXISTS "Users read own roles" ON public.user_roles;
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated
USING ((auth.uid() = user_id) OR private.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert roles" ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update roles" ON public.user_roles FOR UPDATE TO authenticated
USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete roles" ON public.user_roles FOR DELETE TO authenticated
USING (private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users manage own lesson plans" ON public.lesson_plans;
CREATE POLICY "Users manage own lesson plans" ON public.lesson_plans FOR ALL TO authenticated
USING ((auth.uid() = user_id) OR private.has_role(auth.uid(), 'admin')) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own tos" ON public.tos;
CREATE POLICY "Users manage own tos" ON public.tos FOR ALL TO authenticated
USING ((auth.uid() = user_id) OR private.has_role(auth.uid(), 'admin')) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own assessments" ON public.assessments;
CREATE POLICY "Users manage own assessments" ON public.assessments FOR ALL TO authenticated
USING ((auth.uid() = user_id) OR private.has_role(auth.uid(), 'admin')) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins delete profiles" ON public.profiles;
CREATE POLICY "Admins delete profiles" ON public.profiles FOR DELETE TO authenticated
USING (private.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated
USING ((auth.uid() = id) OR private.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated
USING ((auth.uid() = id) OR private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users read own logs, admins read all" ON public.activity_logs;
CREATE POLICY "Users read own logs, admins read all" ON public.activity_logs FOR SELECT TO authenticated
USING ((auth.uid() = user_id) OR private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage modules" ON public.portal_modules;
CREATE POLICY "Admins manage modules" ON public.portal_modules FOR ALL TO authenticated
USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage announcements" ON public.announcements;
CREATE POLICY "Admins manage announcements" ON public.announcements FOR ALL TO authenticated
USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Anyone reads published" ON public.announcements;
CREATE POLICY "Anyone reads published" ON public.announcements FOR SELECT TO anon, authenticated
USING (published = true);
CREATE POLICY "Admins read all announcements" ON public.announcements FOR SELECT TO authenticated
USING (private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage settings" ON public.website_settings;
CREATE POLICY "Admins manage settings" ON public.website_settings FOR ALL TO authenticated
USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Anyone reads settings" ON public.website_settings;
CREATE POLICY "Anyone reads public settings" ON public.website_settings FOR SELECT TO anon, authenticated
USING (key IN ('hero','mission','vision','footer','contact'));

DROP POLICY IF EXISTS "Users can view their own devices" ON public.user_devices;
CREATE POLICY "Users can view their own devices" ON public.user_devices FOR SELECT TO authenticated
USING ((auth.uid() = user_id) OR private.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Users and admins can delete devices" ON public.user_devices;
CREATE POLICY "Users and admins can delete devices" ON public.user_devices FOR DELETE TO authenticated
USING ((auth.uid() = user_id) OR private.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Users can insert their own devices" ON public.user_devices;
CREATE POLICY "Users can insert their own devices" ON public.user_devices FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own devices" ON public.user_devices;
CREATE POLICY "Users can update their own devices" ON public.user_devices FOR UPDATE TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $function$
DECLARE
  is_first BOOLEAN;
BEGIN
  SELECT COUNT(*) = 0 INTO is_first FROM public.profiles;
  INSERT INTO public.profiles (id, email, first_name, middle_name, last_name, employee_id, school, division, region, position, status)
  VALUES (
    NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name',''),
    COALESCE(NEW.raw_user_meta_data->>'middle_name',''),
    COALESCE(NEW.raw_user_meta_data->>'last_name',''),
    COALESCE(NEW.raw_user_meta_data->>'employee_id',''),
    COALESCE(NEW.raw_user_meta_data->>'school',''),
    COALESCE(NEW.raw_user_meta_data->>'division',''),
    COALESCE(NEW.raw_user_meta_data->>'region',''),
    COALESCE(NEW.raw_user_meta_data->>'position',''),
    CASE WHEN is_first THEN 'approved'::public.user_status ELSE 'pending'::public.user_status END
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'teacher') ON CONFLICT DO NOTHING;
  IF is_first THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END; $function$;
