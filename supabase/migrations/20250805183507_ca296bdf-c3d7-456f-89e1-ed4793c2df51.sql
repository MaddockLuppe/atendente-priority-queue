-- Corrigir políticas RLS da tabela attendants
DROP POLICY IF EXISTS "Authenticated users can manage attendants" ON attendants;
DROP POLICY IF EXISTS "Authenticated users can view attendants" ON attendants;

-- Criar função para verificar se usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Políticas simplificadas
CREATE POLICY "Anyone can view attendants" 
ON attendants 
FOR SELECT 
TO authenticated, anon
USING (true);

CREATE POLICY "Admins can insert attendants" 
ON attendants 
FOR INSERT 
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update attendants" 
ON attendants 
FOR UPDATE 
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can delete attendants" 
ON attendants 
FOR DELETE 
TO authenticated
USING (public.is_admin());