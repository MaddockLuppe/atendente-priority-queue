-- Ensure required schemas and extensions
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

-- Recreate secure auth function using extensions.crypt
DROP FUNCTION IF EXISTS public.authenticate_user_secure(text, text);
CREATE OR REPLACE FUNCTION public.authenticate_user_secure(
  p_username text,
  p_password text
)
RETURNS TABLE (
  id uuid,
  username text,
  display_name text,
  role text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, extensions
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.display_name,
    p.role
  FROM public.profiles p
  WHERE p.username = p_username
    AND extensions.crypt(p_password, p.password_hash) = p.password_hash;
END;
$$;

GRANT EXECUTE ON FUNCTION public.authenticate_user_secure(text, text) TO anon, authenticated;

-- Upsert admin user with password 'admin123'
DO $$
DECLARE
  v_username text := 'admin';
  v_display  text := 'Administrador';
  v_password text := 'admin123';
  v_hash     text;
BEGIN
  v_hash := extensions.crypt(v_password, extensions.gen_salt('bf', 10));

  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = v_username) THEN
    UPDATE public.profiles
      SET password_hash = v_hash,
          role = 'admin',
          display_name = v_display,
          updated_at = now()
      WHERE username = v_username;
  ELSE
    INSERT INTO public.profiles (id, username, display_name, role, password_hash)
    VALUES (extensions.gen_random_uuid(), v_username, v_display, 'admin', v_hash);
  END IF;
END$$;