-- =====================================================
-- SCRIPT PARA CRIAR USUÁRIO ADMIN NO SUPABASE
-- =====================================================
-- Execute este script no Supabase Dashboard > SQL Editor
-- Credenciais: admin / admin123
-- =====================================================

-- Inserir usuário admin com senha hasheada
INSERT INTO profiles (user_id, username, display_name, role, password_hash)
VALUES (
  '1581c683-7892-4db1-9fe8-4eb9248eb097',
  'admin',
  'Administrador',
  'admin',
  '$2b$12$hHeepYY2rg7iVyQbwsZ9XOzy.IkpT.ZJ9a..8mXDjDboev4kGY.TO'
)
ON CONFLICT (username) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  role = EXCLUDED.role,
  password_hash = EXCLUDED.password_hash;

-- Verificar se o usuário foi criado
SELECT 
  user_id,
  username,
  display_name,
  role,
  'Senha hash criado com sucesso' as status
FROM profiles 
WHERE username = 'admin';

-- Contar total de usuários
SELECT COUNT(*) as total_usuarios FROM profiles;

-- =====================================================
-- INSTRUÇÕES:
-- 1. Copie todo este código
-- 2. Acesse https://supabase.com
-- 3. Vá no seu projeto
-- 4. Clique em "SQL Editor" no menu lateral
-- 5. Cole este código e clique "Run"
-- 6. Teste o login com: admin / admin123
-- =====================================================