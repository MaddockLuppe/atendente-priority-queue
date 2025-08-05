-- Fix attendance_history RLS policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Anyone can view attendance history" ON public.attendance_history;
DROP POLICY IF EXISTS "Authenticated users can manage attendance history" ON public.attendance_history;

-- Create new simplified policies that work correctly
CREATE POLICY "Everyone can view attendance history" 
ON public.attendance_history FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert attendance history" 
ON public.attendance_history FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update attendance history" 
ON public.attendance_history FOR UPDATE 
USING (true);

CREATE POLICY "Authenticated users can delete attendance history" 
ON public.attendance_history FOR DELETE 
USING (true);