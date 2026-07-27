-- Prevent privilege escalation: members may only update non-privileged columns.
-- role / active_season_pass remain writable only via service_role / Dashboard SQL.

REVOKE UPDATE ON TABLE public.profiles FROM authenticated;

GRANT UPDATE (full_name, phone, updated_at) ON TABLE public.profiles TO authenticated;
