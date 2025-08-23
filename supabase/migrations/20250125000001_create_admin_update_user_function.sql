-- Criar função RPC para atualização segura de usuários por administradores
CREATE OR REPLACE FUNCTION public.admin_update_user(
  p_user_id uuid,
  p_username text DEFAULT NULL,
  p_display_name text DEFAULT NULL,
  p_role text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, extensions
AS $$
DECLARE
  v_current_role text;
  v_admin_count integer;
BEGIN
  -- Verificar se o usuário atual é admin
  IF NOT public.is_current_user_admin() THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Apenas administradores podem atualizar usuários'
    );
  END IF;
  
  -- Verificar se o usuário a ser atualizado existe
  SELECT role INTO v_current_role
  FROM public.profiles
  WHERE id = p_user_id;
  
  IF v_current_role IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuário não encontrado'
    );
  END IF;
  
  -- Se está tentando alterar o role de admin para outro tipo
  IF v_current_role = 'admin' AND p_role IS NOT NULL AND p_role != 'admin' THEN
    -- Verificar se não é o último admin
    SELECT COUNT(*) INTO v_admin_count
    FROM public.profiles
    WHERE role = 'admin';
    
    IF v_admin_count <= 1 THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Não é possível rebaixar o último administrador'
      );
    END IF;
  END IF;
  
  -- Verificar se o username já existe (se fornecido)
  IF p_username IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE username = p_username AND id != p_user_id
    ) THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Nome de usuário já existe'
      );
    END IF;
  END IF;
  
  -- Atualizar o usuário
  UPDATE public.profiles
  SET 
    username = COALESCE(p_username, username),
    display_name = COALESCE(p_display_name, display_name),
    role = COALESCE(p_role, role),
    updated_at = now()
  WHERE id = p_user_id;
  
  -- Verificar se a atualização foi bem-sucedida
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Falha ao atualizar usuário'
    );
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Usuário atualizado com sucesso'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Conceder permissões para a função
GRANT EXECUTE ON FUNCTION public.admin_update_user(uuid, text, text, text) TO authenticated;