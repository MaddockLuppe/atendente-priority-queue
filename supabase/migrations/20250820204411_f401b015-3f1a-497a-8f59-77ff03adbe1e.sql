-- Criar função para atualização segura de senhas
CREATE OR REPLACE FUNCTION public.admin_update_password(
  p_user_id uuid,
  p_new_password text
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  v_hash text;
BEGIN
  -- Gerar hash da nova senha
  v_hash := extensions.crypt(p_new_password, extensions.gen_salt('bf', 10));
  
  -- Atualizar a senha
  UPDATE public.profiles
  SET password_hash = v_hash,
      updated_at = now()
  WHERE id = p_user_id;
  
  -- Verificar se a atualização foi bem-sucedida
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuário não encontrado'
    );
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Senha atualizada com sucesso'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;