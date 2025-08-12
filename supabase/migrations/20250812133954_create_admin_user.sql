
-- Remover todos os usuários existentes e criar novo admin
-- Usuário: admin
-- Senha: admin123
-- Gerado automaticamente em: 2025-08-12T15:52:02.794Z

-- Remover todos os usuários existentes
DELETE FROM profiles;

-- Criar novo usuário administrador
INSERT INTO profiles (user_id, username, display_name, role, password_hash)
VALUES (
  gen_random_uuid(),
  'admin',
  'Administrador',
  'admin',
  '$2b$10$5EnGfQWsZ2O9xX.TdNYiu.vvkrZCOEOnIFlzhQPYp03ojsqeUl77O'
);

-- Verificar se o usuário foi criado corretamente
SELECT 
  id,
  username,
  display_name,
  role,
  created_at
FROM profiles 
WHERE username = 'admin';

-- Contar total de usuários
SELECT COUNT(*) as total_users FROM profiles;
