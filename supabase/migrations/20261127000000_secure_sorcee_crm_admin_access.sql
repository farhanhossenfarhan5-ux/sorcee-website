-- SORCEE CRM: secure buyer records behind server-managed admin role.
-- The dashboard uses Supabase Auth; never expose service_role/secret keys in the browser.
revoke all on table public.buyer_inquiries from anon;
revoke all on table public.buyer_inquiry_activities from anon;

grant select, insert, update on table public.buyer_inquiries to authenticated;
grant select, insert on table public.buyer_inquiry_activities to authenticated;
grant usage, select on sequence public.buyer_inquiries_inquiry_number_seq to authenticated;

create policy "SORCEE admins read buyer inquiries"
on public.buyer_inquiries for select to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "SORCEE admins create buyer inquiries"
on public.buyer_inquiries for insert to authenticated
with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "SORCEE admins update buyer inquiries"
on public.buyer_inquiries for update to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "SORCEE admins read inquiry activities"
on public.buyer_inquiry_activities for select to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "SORCEE admins add inquiry activities"
on public.buyer_inquiry_activities for insert to authenticated
with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  and (created_by is null or created_by = (select auth.uid())));
