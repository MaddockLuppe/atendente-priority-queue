-- Inserir usuário abassa com senha xangoeoxum@2025@
INSERT INTO profiles (user_id, username, display_name, role, password_hash)
VALUES (
  gen_random_uuid(),
  'abassa',
  'Administrador',
  'admin',
  '$2b$10$YourHashedPasswordHere'
) ON CONFLICT (username) DO NOTHING;