-- MIGRAÇÃO SIMPLIFICADA - APENAS ADMIN E ATENDENTE GENÉRICO
-- Solução sem cadastros individuais

-- Limpar tabela profiles
DELETE FROM profiles;

-- Inserir usuário admin
INSERT INTO profiles (user_id, username, display_name, role, password_hash)
VALUES (
  '17071192-7996-48d7-b963-b2a17ea91189',
  'admin',
  'Administrador',
  'admin',
  '$2b$12$.Sr6qc2fYCwnqcWQue.3vugXGKrwx6pyfTdohqzELi0POC8Xt8db2'
)
ON CONFLICT (username) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  role = EXCLUDED.role,
  password_hash = EXCLUDED.password_hash;

-- Inserir usuário atendente genérico
INSERT INTO profiles (user_id, username, display_name, role, password_hash)
VALUES (
  'fa2e1d74-b34b-4652-94cf-f5a4083f2eba',
  'atendente',
  'Atendente',
  'attendant',
  '$2b$12$yQlvcNEUC108x.GzGA41eOkbec3ZvTAMSlGIzmQ.ZWoodfgCVDfzC'
)
ON CONFLICT (username) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  role = EXCLUDED.role,
  password_hash = EXCLUDED.password_hash;

-- Verificação final
SELECT username, display_name, role FROM profiles ORDER BY role, username;

SELECT COUNT(*) as total_usuarios FROM profiles;