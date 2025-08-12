-- Corrigir constraint da coluna role na tabela profiles
-- Data: 2025-08-12
-- Descrição: Garantir que a constraint aceite os valores corretos: admin, attendant, viewer

-- Remover constraint existente se houver problema
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Recriar constraint com os valores corretos
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('admin', 'attendant', 'viewer'));

-- Verificar se a constraint foi aplicada corretamente
SELECT conname, consrc 
FROM pg_constraint 
WHERE conrelid = 'public.profiles'::regclass 
  AND contype = 'c' 
  AND conname = 'profiles_role_check';