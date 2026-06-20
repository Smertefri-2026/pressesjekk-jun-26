-- PresseSjekk v1 security cleanup
-- Kjørt etter første schema for å rydde Supabase Security Advisor-varsler

alter function public.set_updated_at()
set search_path = public;

revoke execute on function public.handle_new_user()
from public, anon, authenticated;

revoke execute on function public.rls_auto_enable()
from public, anon, authenticated;
