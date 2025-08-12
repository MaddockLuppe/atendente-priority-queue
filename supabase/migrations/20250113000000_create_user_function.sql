-- Criar função RPC para criação segura de usuários
CREATE OR REPLACE FUNCTION public.create_user_secure(
  p_username text,
  p_password text,
  p_display_name text,
  p_role text
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
DECLARE
  v_user_id uuid;
  v_hash text;
BEGIN
  -- Verificar se o usuário atual é admin
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem criar usuários';
  END IF;
  
  -- Gerar UUID para o novo usuário
  v_user_id := extensions.gen_random_uuid();
  
  -- Gerar hash da senha usando pgcrypto
  v_hash := extensions.crypt(p_password, extensions.gen_salt('bf', 10));
  
  -- Inserir o novo usuário
  INSERT INTO public.profiles (id, user_id, username, display_name, role, password_hash)
  VALUES (extensions.gen_random_uuid(), v_user_id, p_username, p_display_name, p_role, v_hash);
  
  -- Retornar os dados do usuário criado
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.display_name,
    p.role
  FROM public.profiles p
  WHERE p.username = p_username;
END;
$$;

-- Conceder permissões para a função
GRANT EXECUTE ON FUNCTION public.create_user_secure(text, text, text, text) TO authenticated;