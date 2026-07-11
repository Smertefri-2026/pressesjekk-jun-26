grant select on table public.quick_checks to authenticated;

drop policy if exists "Admins can read quick checks" on public.quick_checks;

create policy "Admins can read quick checks"
on public.quick_checks
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.is_admin = true
  )
);

revoke all on table public.quick_checks from anon;
