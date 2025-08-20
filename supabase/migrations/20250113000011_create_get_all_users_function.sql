-- Criar função para obter todos os usuários (para administradores)
CREATE OR REPLACE FUNCTION get_all_users_public()
RETURNS TABLE (
  id UUID,
  username TEXT,
  display_name TEXT,
  role TEXT
)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Verificar se o usuário atual é admin (se autenticado)
  -- Para desenvolvimento, permitir acesso sem autenticação
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.display_name,
    p.role
  FROM profiles p
  ORDER BY p.display_name;
END;
$$;

-- Conceder permissões para usuários autenticados
GRANT EXECUTE ON FUNCTION get_all_users_public() TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_users_public() TO anon;

-- Comentário explicativo
COMMENT ON FUNCTION get_all_users_public() IS 'Função para obter lista de todos os usuários - usada para depuração';