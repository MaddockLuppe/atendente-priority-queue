-- Corrigir políticas RLS para permitir login
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Política para permitir SELECT durante login (sem autenticação)
CREATE POLICY "Allow login access" 
ON profiles 
FOR SELECT 
TO anon, authenticated
USING (true);

-- Política para permitir que usuários autenticados vejam apenas seu próprio perfil
CREATE POLICY "Authenticated users can view own profile" 
ON profiles 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

-- Política para permitir que admins vejam todos os perfis
CREATE POLICY "Admins can view all profiles" 
ON profiles 
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Política para permitir que admins insiram novos usuários
CREATE POLICY "Admins can insert users" 
ON profiles 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Política para permitir que admins atualizem usuários
CREATE POLICY "Admins can update users" 
ON profiles 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Política para permitir que admins deletem usuários
CREATE POLICY "Admins can delete users" 
ON profiles 
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);