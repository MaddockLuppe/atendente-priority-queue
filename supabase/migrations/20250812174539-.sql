-- Ensure pgcrypto is available for bcrypt hashing
create extension if not exists pgcrypto;

-- Seed or update the admin user with password 'admin123'
DO $$
DECLARE
  v_username text := 'admin';
  v_display  text := 'Administrador';
  v_password text := 'admin123';
  v_hash     text;
BEGIN
  -- Generate bcrypt hash using pgcrypto (blowfish)
  v_hash := crypt(v_password, gen_salt('bf', 10));

  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = v_username) THEN
    UPDATE public.profiles
      SET password_hash = v_hash,
          role = 'admin',
          display_name = v_display,
          updated_at = now()
      WHERE username = v_username;
  ELSE
    INSERT INTO public.profiles (user_id, username, display_name, role, password_hash)
    VALUES (gen_random_uuid(), v_username, v_display, 'admin', v_hash);
  END IF;
END$$;