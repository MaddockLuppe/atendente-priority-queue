-- MIGRAÇÃO DE ATTENDANTS PARA PROFILES
-- Gerado automaticamente

-- Inserir usuário admin
INSERT INTO profiles (user_id, username, display_name, role, password_hash)
VALUES (
  '17071192-7996-48d7-b963-b2a17ea91189',
  'admin',
  'Administrador',
  'admin',
  '$2b$12$SvpqA7CZM8.Q5us1BCCbf.r/I216kblHhkg1zYIzHr3aOssyaqxF6'
)
ON CONFLICT (username) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  role = EXCLUDED.role,
  password_hash = EXCLUDED.password_hash;

-- Migrar attendants como operadores
INSERT INTO profiles (user_id, username, display_name, role, password_hash)
VALUES (
  'fa2e1d74-b34b-4652-94cf-f5a4083f2eba',
  'mãe',
  'Mãe',
  'attendant',
  '$2b$12$R.NDP/Ecgie2FUN8b686Q.XXXYeleagq4NKj9vM./y1TiqXJWxceq'
)
ON CONFLICT (username) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  role = EXCLUDED.role;

INSERT INTO profiles (user_id, username, display_name, role, password_hash)
VALUES (
  'b5d0996e-c7c0-4f3e-be06-71cb452639fc',
  'levi',
  'Levi',
  'attendant',
  '$2b$12$pH.V2LFMZUrmJqwVaO/szumsG74MHPnwE/sWuDzyvvvCezBZZWkpK'
)
ON CONFLICT (username) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  role = EXCLUDED.role;

INSERT INTO profiles (user_id, username, display_name, role, password_hash)
VALUES (
  '5b4b01a5-fe66-4e30-a9cf-97276f85eac6',
  'jeovane',
  'Jeovane',
  'attendant',
  '$2b$12$08nGLcSgNIcVnncDGJFB6e4GbooTIxkOc0.E0d/HfyMyk/EKKk9w2'
)
ON CONFLICT (username) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  role = EXCLUDED.role;

INSERT INTO profiles (user_id, username, display_name, role, password_hash)
VALUES (
  '072e1237-19a2-49d6-b72e-66d50bf6d7b6',
  'moane',
  'Moane',
  'attendant',
  '$2b$12$9sNAKIRwivMgoQiVLd2Kae4q.GJhyYe/1z9t7.8jIh.PyCd/ua.Lm'
)
ON CONFLICT (username) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  role = EXCLUDED.role;

INSERT INTO profiles (user_id, username, display_name, role, password_hash)
VALUES (
  '0efef6a3-2b7d-4c43-9d43-bcb9b858c03a',
  'talles',
  'Talles',
  'attendant',
  '$2b$12$ZvmR4dWq3MmiBUZ.qJEIOu4fXrS6Nt3sUEnLYx5002PmEgY/vltgO'
)
ON CONFLICT (username) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  role = EXCLUDED.role;

INSERT INTO profiles (user_id, username, display_name, role, password_hash)
VALUES (
  '8d5cf786-475e-46eb-99cf-130439a9df5a',
  'pai',
  'Pai',
  'attendant',
  '$2b$12$XlSocaUnzFoxE7lBNydEje8umvDZDqiZ013Dly7.s6J71fq7Qg9n6'
)
ON CONFLICT (username) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  role = EXCLUDED.role;

INSERT INTO profiles (user_id, username, display_name, role, password_hash)
VALUES (
  '21ea3b38-220e-48dd-b6e3-75167f0ba341',
  'luizwalter',
  'Luiz walter',
  'attendant',
  '$2b$12$lt02dwtZkMf01wLc/AbsFuffN5UcO8.PjhwlRPWA3RXo08A4Ln6z6'
)
ON CONFLICT (username) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  role = EXCLUDED.role;

INSERT INTO profiles (user_id, username, display_name, role, password_hash)
VALUES (
  '47b2368d-0f44-4dc9-8802-bf223c171d2f',
  'elizabeth',
  'Elizabeth',
  'attendant',
  '$2b$12$QgtMO7y.NCe9IWgwSn5kUe7UnxGAdG/DrLEqXmILhiCbwfwAUPvVW'
)
ON CONFLICT (username) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  role = EXCLUDED.role;

INSERT INTO profiles (user_id, username, display_name, role, password_hash)
VALUES (
  'efa8077d-bf9a-4de5-9e8e-f37b2adcc687',
  'felipe',
  'Felipe',
  'attendant',
  '$2b$12$9/0BaMfdGDAuNfzo5aUc4OK6Jq8LMDpVMpebnrlkFNDvNNC3G8ye6'
)
ON CONFLICT (username) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  role = EXCLUDED.role;

INSERT INTO profiles (user_id, username, display_name, role, password_hash)
VALUES (
  'e751cee2-dba3-4dd1-ad66-0e4da6ee338e',
  'janaina',
  'Janaina',
  'attendant',
  '$2b$12$m5gLgsa9n2BY7h1WrbHypOBIa3FG1SbqcrJqhewb1aZt.RNVFE9fC'
)
ON CONFLICT (username) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  role = EXCLUDED.role;

INSERT INTO profiles (user_id, username, display_name, role, password_hash)
VALUES (
  '3e1a7e08-9368-4297-ab57-caacb126e3ec',
  'lucas',
  'Lucas',
  'attendant',
  '$2b$12$dIJBMKD0pxgkBFqukxJrxuTzCWQldVDFnYONh7zZzU3TcpdD7YDi.'
)
ON CONFLICT (username) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  role = EXCLUDED.role;

INSERT INTO profiles (user_id, username, display_name, role, password_hash)
VALUES (
  '908db5a1-47a2-4daf-aaec-83eecb03a087',
  'lara',
  'Lara',
  'attendant',
  '$2b$12$S5HfVEJdbBFNQjXnEu.TVe8U5TxJ60NmungohQUfj61yqWlW3l/Km'
)
ON CONFLICT (username) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  role = EXCLUDED.role;

INSERT INTO profiles (user_id, username, display_name, role, password_hash)
VALUES (
  '541679b1-fb00-422a-8109-65a926340f40',
  'wellington',
  'Wellington',
  'attendant',
  '$2b$12$9wwOEg7uJNE.U6sqwRvcn.EOaT4dNpK3KMjLgxoZJ5wwBmARx3Z7i'
)
ON CONFLICT (username) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  role = EXCLUDED.role;

INSERT INTO profiles (user_id, username, display_name, role, password_hash)
VALUES (
  '8baee687-a44e-49c1-9e57-661048c42861',
  'saide',
  'Saide',
  'attendant',
  '$2b$12$sd1o.jEbWlYKpYcsbUN5q.ivw/zkO8tYlTlaDM9wE4RUgtnfJh4rG'
)
ON CONFLICT (username) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  role = EXCLUDED.role;

-- Verificação final
SELECT username, display_name, role FROM profiles ORDER BY role, username;

SELECT COUNT(*) as total_usuarios FROM profiles;