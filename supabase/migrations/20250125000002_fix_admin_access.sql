-- Criar função alternativa para carregar usuários que não depende de auth.uid()
-- Esta função verifica diretamente se o usuário fornecido é admin

CREATE OR REPLACE FUNCTION public.get_all_users_by_admin(
  p_admin_user_id uuid
)
RETURNS TABLE(
  id uuid,
  username text,
  display_name text,
  role text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_role text;
BEGIN
  -- Verificar se o usuário fornecido é admin
  SELECT role INTO v_admin_role
  FROM public.profiles
  WHERE id = p_admin_user_id;
  
  IF v_admin_role IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  IF v_admin_role != 'admin' THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;
  
  -- Retornar todos os usuários para admins
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.display_name,
    p.role,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  ORDER BY p.display_name;
END;
$$;

-- Conceder permissões para a função
GRANT EXECUTE ON FUNCTION public.get_all_users_by_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_users_by_admin(uuid) TO anon;