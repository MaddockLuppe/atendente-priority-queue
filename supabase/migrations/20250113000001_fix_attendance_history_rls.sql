-- Remover políticas existentes para attendance_history
DROP POLICY IF EXISTS "Authenticated users can view attendance history" ON public.attendance_history;
DROP POLICY IF EXISTS "Authenticated users can manage attendance history" ON public.attendance_history;

-- Criar políticas mais específicas
CREATE POLICY "Anyone can view attendance history" 
ON public.attendance_history 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert attendance history" 
ON public.attendance_history 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update attendance history" 
ON public.attendance_history 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete attendance history" 
ON public.attendance_history 
FOR DELETE 
USING (true);