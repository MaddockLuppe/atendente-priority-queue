-- Create function to get all users for admin with user_id parameter
CREATE OR REPLACE FUNCTION public.get_all_users_admin_fixed(p_user_id UUID)
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
  -- Check if the provided user_id has admin role
  SELECT 
    p.id,
    p.username,
    p.display_name,
    p.role
  FROM public.profiles p
  WHERE EXISTS (
    SELECT 1 FROM public.profiles admin_check
    WHERE admin_check.id = p_user_id 
    AND admin_check.role = 'admin'
  )
  ORDER BY p.display_name;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_all_users_admin_fixed(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_users_admin_fixed(UUID) TO anon;