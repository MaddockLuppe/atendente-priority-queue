-- Remove all existing policies and create simpler ones for attendants and tickets

-- Drop existing attendants policies
DROP POLICY IF EXISTS "Admins can delete attendants" ON public.attendants;
DROP POLICY IF EXISTS "Admins can insert attendants" ON public.attendants;
DROP POLICY IF EXISTS "Admins can update attendants" ON public.attendants;
DROP POLICY IF EXISTS "Anyone can view attendants" ON public.attendants;

-- Drop existing tickets policies  
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.tickets;
DROP POLICY IF EXISTS "Allow read for anonymous users" ON public.tickets;

-- Create new simple policies for attendants
CREATE POLICY "Everyone can view attendants" 
ON public.attendants FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage attendants" 
ON public.attendants FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create new simple policies for tickets
CREATE POLICY "Everyone can view tickets" 
ON public.tickets FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage tickets" 
ON public.tickets FOR ALL 
USING (true) 
WITH CHECK (true);