
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
END; $$;
