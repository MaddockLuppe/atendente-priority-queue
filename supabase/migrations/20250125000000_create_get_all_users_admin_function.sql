-- Create function to get all users for admin (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_all_users_admin()
RETURNS TABLE (
  id uuid,
  username text,
  display_name text,
  role text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  -- Only allow admins to call this function
  SELECT 
    p.id,
    p.username,
    p.display_name,
    p.role
  FROM public.profiles p
  WHERE EXISTS (
    SELECT 1 FROM public.profiles admin_check
    WHERE admin_check.user_id = auth.uid() 
    AND admin_check.role = 'admin'
  )
  ORDER BY p.display_name;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_all_users_admin() TO authenticated;