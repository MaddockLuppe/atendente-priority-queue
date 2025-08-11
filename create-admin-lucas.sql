-- =====================================================
-- SCRIPT PARA CRIAR USUÁRIO ADMINISTRADOR
-- =====================================================
-- Usuário: lucas
-- Senha: 12061409
-- Role: admin
-- 
-- INSTRUÇÕES:
-- 1. Copie e cole este script no Supabase Dashboard > SQL Editor
-- 2. Execute o script
-- 3. Verifique se o usuário foi criado corretamente
-- =====================================================

-- Criar usuário administrador lucas
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
  created_at,
  updated_at
FROM profiles 
WHERE username = 'lucas';

-- Verificar total de usuários admin
SELECT 
  COUNT(*) as total_admins,
  array_agg(username) as admin_usernames
FROM profiles 
WHERE role = 'admin';