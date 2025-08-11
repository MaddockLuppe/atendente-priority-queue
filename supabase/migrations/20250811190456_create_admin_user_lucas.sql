-- Criar usuário administrador: lucas
-- Senha: 12061409
-- Gerado automaticamente em: 2025-08-11T19:04:56.610Z

INSERT INTO profiles (user_id, username, display_name, role, password_hash)
VALUES (
  gen_random_uuid(),
  'lucas',
  'Lucas - Administrador',
  'admin',
  '$2b$10$OwsjgHaPulD2zOjgWrnXpOYcjYUvmNHj4d8QskqaiOkC56wADA3Zi'
) ON CONFLICT (username) 
DO UPDATE SET 
  password_hash = '$2b$10$OwsjgHaPulD2zOjgWrnXpOYcjYUvmNHj4d8QskqaiOkC56wADA3Zi',
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
