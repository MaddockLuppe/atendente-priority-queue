-- Create function to get all users for admin with user_id parameter
CREATE OR REPLACE FUNCTION public.get_all_users_by_admin_id(admin_user_id uuid)
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
    WHERE admin_check.id = admin_user_id 
    AND admin_check.role = 'admin'
  )
  ORDER BY p.display_name;
$$;

-- Grant execute permission to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION public.get_all_users_by_admin_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_users_by_admin_id(uuid) TO anon;