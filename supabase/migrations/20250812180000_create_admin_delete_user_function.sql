-- Criar função RPC para deletar usuários com segurança
CREATE OR REPLACE FUNCTION public.admin_delete_user(
  p_user_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, extensions
AS $$
DECLARE
  v_target_user_role text;
  v_admin_count integer;
BEGIN
  -- Verificar se o usuário existe e obter seu role
  SELECT role INTO v_target_user_role
  FROM public.profiles
  WHERE id = p_user_id;
  
  IF v_target_user_role IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuário não encontrado'
    );
  END IF;
  
  -- Verificar se é o último admin
  IF v_target_user_role = 'admin' THEN
    SELECT COUNT(*) INTO v_admin_count
    FROM public.profiles
    WHERE role = 'admin';
    
    IF v_admin_count <= 1 THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Não é possível excluir o último administrador'
      );
    END IF;
  END IF;
  
  -- Deletar o usuário
  DELETE FROM public.profiles
  WHERE id = p_user_id;
  
  -- Verificar se a deleção foi bem-sucedida
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Falha ao deletar usuário'
    );
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Usuário deletado com sucesso'
  );
END;
$$;

-- Conceder permissões para a função
GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid) TO authenticated, anon;