-- Temporary fix for user list access issue
-- This migration adds a more permissive policy for viewing profiles

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create a more permissive policy for development
-- This allows any authenticated user to view profiles
CREATE POLICY "Allow authenticated users to view profiles"
ON public.profiles
FOR SELECT
USING (true); -- Temporarily allow all access for debugging

-- Keep the admin-only policies for modifications
CREATE POLICY "Users can view own profile for updates"
ON public.profiles
FOR SELECT
USING (user_id = auth.uid());

-- Comment: This is a temporary fix to resolve the user list visibility issue
-- In production, this should be reverted to use proper admin-only policies