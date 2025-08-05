-- Remover todas as políticas conflitantes
DROP POLICY IF EXISTS "Allow login access" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert users" ON profiles;
DROP POLICY IF EXISTS "Admins can update users" ON profiles;
DROP POLICY IF EXISTS "Admins can delete users" ON profiles;

-- Criar função de segurança para evitar recursão infinita
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Políticas simplificadas para evitar recursão
-- Permite acesso para login (usuarios anônimos)
CREATE POLICY "Public read for login" 
ON profiles 
FOR SELECT 
TO anon, authenticated
USING (true);

-- Permite inserção apenas para admins autenticados
CREATE POLICY "Admin insert" 
ON profiles 
FOR INSERT 
TO authenticated
WITH CHECK (public.get_current_user_role() = 'admin');

-- Permite atualização apenas para admins autenticados
CREATE POLICY "Admin update" 
ON profiles 
FOR UPDATE 
TO authenticated
USING (public.get_current_user_role() = 'admin');

-- Permite deleção apenas para admins autenticados  
CREATE POLICY "Admin delete" 
ON profiles 
FOR DELETE 
TO authenticated
USING (public.get_current_user_role() = 'admin');