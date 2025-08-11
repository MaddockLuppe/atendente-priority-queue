-- Phase 1: Critical RLS Policy Security Fixes

-- Drop the dangerous public read policy on profiles
DROP POLICY IF EXISTS "Public read for login" ON public.profiles;

-- Create secure authentication function that doesn't expose sensitive data
CREATE OR REPLACE FUNCTION public.authenticate_user(p_username text, p_password_hash text)
RETURNS TABLE(user_id uuid, username text, display_name text, role text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    profiles.user_id,
    profiles.username,
    profiles.display_name,
    profiles.role
  FROM public.profiles
  WHERE profiles.username = p_username 
    AND profiles.password_hash = p_password_hash;
END;
$$;

-- Create secure role checking function
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM public.profiles WHERE user_id = p_user_id LIMIT 1;
$$;

-- Create function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  );
$$;

-- Secure RLS policies for profiles table

-- Users can only view their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (user_id = auth.uid());

-- Admins can view all profiles (for user management)
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.is_current_user_admin());

-- Users can update their own profile (except role)
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid() 
  AND role = (SELECT role FROM public.profiles WHERE user_id = auth.uid())
);

-- Only admins can update any profile
CREATE POLICY "Admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (public.is_current_user_admin());

-- Only admins can insert new profiles (user creation)
CREATE POLICY "Admins can create profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (public.is_current_user_admin());

-- Only admins can delete profiles with restrictions
CREATE POLICY "Admins can delete profiles" 
ON public.profiles 
FOR DELETE 
USING (
  public.is_current_user_admin() 
  AND user_id != auth.uid() -- Prevent self-deletion
);

-- Secure attendance history policies
DROP POLICY IF EXISTS "Everyone can view attendance history" ON public.attendance_history;

CREATE POLICY "Authenticated users can view attendance history" 
ON public.attendance_history 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Secure attendants policies  
DROP POLICY IF EXISTS "Everyone can view attendants" ON public.attendants;

CREATE POLICY "Authenticated users can view attendants" 
ON public.attendants 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Secure tickets policies
DROP POLICY IF EXISTS "Everyone can view tickets" ON public.tickets;

CREATE POLICY "Authenticated users can view tickets" 
ON public.tickets 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Secure queue_state policies
DROP POLICY IF EXISTS "Anyone can view queue state" ON public.queue_state;

CREATE POLICY "Authenticated users can view queue state" 
ON public.queue_state 
FOR SELECT 
USING (auth.role() = 'authenticated');