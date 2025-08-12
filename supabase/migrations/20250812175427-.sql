-- Ensure pgcrypto is available for password verification
create extension if not exists pgcrypto;

-- Secure authentication function that verifies password server-side using bcrypt
create or replace function public.authenticate_user_secure(
  p_username text,
  p_password text
)
returns table (
  user_id uuid,
  username text,
  display_name text,
  role text
)
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  return query
  select 
    profiles.user_id,
    profiles.username,
    profiles.display_name,
    profiles.role
  from public.profiles
  where profiles.username = p_username
    and crypt(p_password, profiles.password_hash) = profiles.password_hash;
end;
$$;

-- Allow both anon and authenticated roles to execute the function
grant execute on function public.authenticate_user_secure(text, text) to anon, authenticated;