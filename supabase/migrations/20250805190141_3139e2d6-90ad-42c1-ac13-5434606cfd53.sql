-- Fix profiles RLS policies for user creation
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admin insert" ON public.profiles;
DROP POLICY IF EXISTS "Admin update" ON public.profiles;
DROP POLICY IF EXISTS "Admin delete" ON public.profiles;

-- Create new policies that allow authenticated users to manage profiles
CREATE POLICY "Authenticated users can insert profiles" 
ON public.profiles FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update profiles" 
ON public.profiles FOR UPDATE 
USING (true);

CREATE POLICY "Authenticated users can delete profiles" 
ON public.profiles FOR DELETE 
USING (true);