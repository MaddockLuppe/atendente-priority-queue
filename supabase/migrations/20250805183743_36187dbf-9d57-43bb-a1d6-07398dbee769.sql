-- Corrigir completamente as políticas RLS da tabela tickets
DROP POLICY IF EXISTS "Anyone can view tickets" ON tickets;
DROP POLICY IF EXISTS "Authenticated users can manage tickets" ON tickets;

-- Permitir acesso completo para usuários autenticados
CREATE POLICY "Allow all operations for authenticated users" 
ON tickets 
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Permitir visualização para usuários anônimos
CREATE POLICY "Allow read for anonymous users" 
ON tickets 
FOR SELECT 
TO anon
USING (true);