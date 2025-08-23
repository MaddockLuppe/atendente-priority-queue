-- Fix get_all_users_admin function to work without auth.uid()
-- This version accepts the user_id as parameter and verifies admin role directly

CREATE OR REPLACE FUNCTION public.get_all_users_admin_by_id(
  p_user_id uuid
)
RETURNS TABLE (
  id uuid,
  username text,
  display_name text,
  role text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_role text;
BEGIN
  -- Check if the provided user is admin
  SELECT p.role INTO v_user_role
  FROM public.profiles p
  WHERE p.id = p_user_id;
  
  -- If user not found or not admin, deny access
  IF v_user_role IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  IF v_user_role != 'admin' THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;
  
  -- Return all users for admin
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.display_name,
    p.role,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  ORDER BY p.display_name;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_all_users_admin_by_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_users_admin_by_id(uuid) TO anon;