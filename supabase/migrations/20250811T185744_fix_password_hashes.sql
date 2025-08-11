-- Corrigir hashes de senha inválidos
-- Gerado automaticamente em: 2025-08-11T18:57:44.080Z

-- Corrigir hash do usuário lucas
INSERT INTO profiles (user_id, username, display_name, role, password_hash)
VALUES (
  gen_random_uuid(),
  'lucas',
  'Lucas - Administrador',
  'admin',
  '$2b$10$LY09yoqdfixd0wvs1sZ1VuAH5nVsQijo0MJA0fTu.7J2WgJHxdEfu'
) ON CONFLICT (username) 
DO UPDATE SET 
  password_hash = '$2b$10$LY09yoqdfixd0wvs1sZ1VuAH5nVsQijo0MJA0fTu.7J2WgJHxdEfu',
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
  '$2b$10$jzVSkMU3jlGAQ9nlGDDAHu6dlgNuwzS3kgQ/5l7bTNfb1hxoEf6lO'
) ON CONFLICT (username) 
DO UPDATE SET 
  password_hash = '$2b$10$jzVSkMU3jlGAQ9nlGDDAHu6dlgNuwzS3kgQ/5l7bTNfb1hxoEf6lO',
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