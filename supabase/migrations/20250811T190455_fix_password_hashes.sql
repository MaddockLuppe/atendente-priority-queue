-- Corrigir hashes de senha inválidos
-- Gerado automaticamente em: 2025-08-11T19:04:55.015Z

-- Corrigir hash do usuário lucas
INSERT INTO profiles (user_id, username, display_name, role, password_hash)
VALUES (
  gen_random_uuid(),
  'lucas',
  'Lucas - Administrador',
  'admin',
  '$2b$10$W3wrZEDTzoL7wZzKBleatODlliNwTB1oRmSGL1WQWOJqGHEBmx8oa'
) ON CONFLICT (username) 
DO UPDATE SET 
  password_hash = '$2b$10$W3wrZEDTzoL7wZzKBleatODlliNwTB1oRmSGL1WQWOJqGHEBmx8oa',
  display_name = 'Lucas - Administrador',
  role = 'admin',
  updated_at = now();

-- Corrigir hash do usuário abassa
INSERT INTO profiles (user_id, username, display_name, role, password_hash)
VALUES (
  gen_random_uuid(),
  'abassa',
  'Administrador',
  'admin',
  '$2b$10$LjbZEVbKr7PjzV10G836Ae598I6xT7608ENYDxBaBk6Lzsz4SHxhG'
) ON CONFLICT (username) 
DO UPDATE SET 
  password_hash = '$2b$10$LjbZEVbKr7PjzV10G836Ae598I6xT7608ENYDxBaBk6Lzsz4SHxhG',
  display_name = 'Administrador',
  role = 'admin',
  updated_at = now();

-- Verificar usuários corrigidos
SELECT 
  username,
  display_name,
  role,
  created_at,
  updated_at
FROM profiles 
WHERE username IN ('lucas', 'abassa')
ORDER BY username;