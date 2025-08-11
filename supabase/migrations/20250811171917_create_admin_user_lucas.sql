-- Criar usuário administrador: lucas
-- Senha: 12061409
-- Gerado automaticamente em: 2025-08-11T17:19:17.085Z

INSERT INTO profiles (user_id, username, display_name, role, password_hash)
VALUES (
  gen_random_uuid(),
  'lucas',
  'Lucas - Administrador',
  'admin',
  '$2b$10$ltSub8pDfKD3A4jy9ckh9uD3MO.GFi2lXssP/9WgkLyp8VJGcrEAe'
) ON CONFLICT (username) 
DO UPDATE SET 
  password_hash = '$2b$10$ltSub8pDfKD3A4jy9ckh9uD3MO.GFi2lXssP/9WgkLyp8VJGcrEAe',
  display_name = 'Lucas - Administrador',
  role = 'admin',
  updated_at = now();

-- Verificar se o usuário foi criado corretamente
SELECT 
  id,
  username,
  display_name,
  role,
  created_at
FROM profiles 
WHERE username = 'lucas';
