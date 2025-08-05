-- Inserir dados iniciais dos atendentes (se não existirem)
INSERT INTO public.attendants (name) 
SELECT name FROM (VALUES 
  ('pai'),
  ('mae'),
  ('moane'),
  ('elizabeth'),
  ('jeovane'),
  ('felipe'),
  ('luiz walter'),
  ('lara'),
  ('levi'),
  ('talles'),
  ('wellingtom')
) AS new_attendants(name)
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendants WHERE attendants.name = new_attendants.name
);

-- Inserir usuário admin inicial (se não existir)
INSERT INTO public.profiles (user_id, username, display_name, role, password_hash) 
SELECT * FROM (VALUES 
  ('00000000-0000-0000-0000-000000000001'::uuid, 'admin', 'Administrador', 'admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
) AS new_profiles(user_id, username, display_name, role, password_hash)
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE profiles.username = new_profiles.username
);

-- Inserir estado inicial da fila (se não existir)
INSERT INTO public.queue_state (next_preferential_number, next_normal_number) 
SELECT 1, 1
WHERE NOT EXISTS (SELECT 1 FROM public.queue_state);