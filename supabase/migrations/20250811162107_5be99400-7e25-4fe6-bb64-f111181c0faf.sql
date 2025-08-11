-- Remove overly permissive RLS policies that allow any authenticated user to access all profiles
DROP POLICY IF EXISTS "Authenticated users can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can delete profiles" ON public.profiles;

-- Ensure only proper role-based access policies remain:
-- 1. Users can view only their own profile
-- 2. Admins can view all profiles
-- 3. Users can update only their own profile (without changing role)
-- 4. Admins can update all profiles
-- 5. Admins can create profiles
-- 6. Admins can delete profiles (except themselves)

-- These policies should already exist but let's ensure they're correct:

-- Policy for users to view their own profile (should already exist)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND policyname = 'Users can view own profile'
    ) THEN
        CREATE POLICY "Users can view own profile" ON public.profiles
        FOR SELECT USING (user_id = auth.uid());
    END IF;
END $$;

-- Policy for admins to view all profiles (should already exist)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND policyname = 'Admins can view all profiles'
    ) THEN
        CREATE POLICY "Admins can view all profiles" ON public.profiles
        FOR SELECT USING (is_current_user_admin());
    END IF;
END $$;