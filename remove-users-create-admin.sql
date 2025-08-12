-- Script para remover todos os usuários e criar novo admin
-- Execute este script no Supabase Dashboard > SQL Editor
-- Usuário: admin
-- Senha: admin123
-- IMPORTANTE: Este hash foi gerado com bcryptjs (usado pela aplicação)

-- 1. Remover todos os usuários existentes
DELETE FROM profiles;

-- 2. Criar novo usuário administrador
INSERT INTO profiles (username, display_name, role, password_hash)
VALUES (
  'admin',
  'Administrador',
  'admin',
  '$2b$10$mmdjWHT/fNmeWZZrrXnGnOsU2jYKb7Jg/pc5vkLMBa1zeRw9STW9.'
);

-- 3. Verificar se o usuário foi criado corretamente
SELECT 
  id,
  username,
  display_name,
  role,
  created_at,
  LENGTH(password_hash) as hash_length
FROM profiles 
WHERE username = 'admin';

-- 4. Confirmar que apenas um usuário existe
SELECT COUNT(*) as total_users FROM profiles;