-- Corrigir políticas RLS para tickets
DROP POLICY IF EXISTS "Authenticated users can manage tickets" ON tickets;
DROP POLICY IF EXISTS "Authenticated users can view tickets" ON tickets;

CREATE POLICY "Anyone can view tickets" 
ON tickets 
FOR SELECT 
TO authenticated, anon
USING (true);

CREATE POLICY "Authenticated users can manage tickets" 
ON tickets 
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Corrigir políticas RLS para attendance_history  
DROP POLICY IF EXISTS "Authenticated users can manage attendance history" ON attendance_history;
DROP POLICY IF EXISTS "Authenticated users can view attendance history" ON attendance_history;

CREATE POLICY "Anyone can view attendance history" 
ON attendance_history 
FOR SELECT 
TO authenticated, anon
USING (true);

CREATE POLICY "Authenticated users can manage attendance history" 
ON attendance_history 
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Corrigir políticas RLS para queue_state
DROP POLICY IF EXISTS "Authenticated users can update queue state" ON queue_state;
DROP POLICY IF EXISTS "Authenticated users can view queue state" ON queue_state;

CREATE POLICY "Anyone can view queue state" 
ON queue_state 
FOR SELECT 
TO authenticated, anon
USING (true);

CREATE POLICY "Authenticated users can update queue state" 
ON queue_state 
FOR UPDATE
TO authenticated
USING (true);