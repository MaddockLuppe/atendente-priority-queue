-- Deletar usuário atual e criar novo com senha correta
DELETE FROM profiles WHERE username = 'abassa';

-- Inserir usuário com hash correto gerado pelo bcrypt
INSERT INTO profiles (user_id, username, display_name, role, password_hash)
VALUES (
  gen_random_uuid(),
  'abassa',
  'Administrador',
  'admin',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
);