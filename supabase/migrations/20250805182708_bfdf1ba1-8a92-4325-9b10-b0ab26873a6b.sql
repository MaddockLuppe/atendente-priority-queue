-- Criar usuário abassa com senha xangoeoxum@2025@ corretamente hasheada
INSERT INTO profiles (user_id, username, display_name, role, password_hash)
VALUES (
  gen_random_uuid(),
  'abassa',
  'Administrador',
  'admin',
  '$2b$10$XqsKzZvE4VFwKDa2dA3s4Oq1hzLkB3xGWwCxCzOqYsK4xGWwKzXqK'
) ON CONFLICT (username) 
DO UPDATE SET 
  password_hash = '$2b$10$XqsKzZvE4VFwKDa2dA3s4Oq1hzLkB3xGWwCxCzOqYsK4xGWwKzXqK',
  display_name = 'Administrador',
  role = 'admin';