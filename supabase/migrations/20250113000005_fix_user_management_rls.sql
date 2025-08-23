-- Criar função RPC para permitir que admins vejam todos os usuários
-- Esta função contorna as políticas RLS restritivas

CREATE OR REPLACE FUNCTION public.get_all_users_admin()
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
BEGIN
  -- Verificar se o usuário atual é admin
  IF NOT public.is_current_user_admin() THEN
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

-- Garantir que a função pode ser chamada por usuários autenticados
GRANT EXECUTE ON FUNCTION public.get_all_users_admin() TO authenticated;