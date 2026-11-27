-- Optimize SORCEE CRM admin role lookups and cover auth-user foreign keys.
drop policy if exists "SORCEE admins read buyer inquiries" on public.buyer_inquiries;
drop policy if exists "SORCEE admins create buyer inquiries" on public.buyer_inquiries;
drop policy if exists "SORCEE admins update buyer inquiries" on public.buyer_inquiries;
drop policy if exists "SORCEE admins read inquiry activities" on public.buyer_inquiry_activities;
drop policy if exists "SORCEE admins add inquiry activities" on public.buyer_inquiry_activities;

create policy "SORCEE admins read buyer inquiries"
on public.buyer_inquiries for select to authenticated
using ((((select auth.jwt()) -> 'app_metadata' ->> 'role')) = 'admin');

create policy "SORCEE admins create buyer inquiries"
on public.buyer_inquiries for insert to authenticated
with check ((((select auth.jwt()) -> 'app_metadata' ->> 'role')) = 'admin');

create policy "SORCEE admins update buyer inquiries"
on public.buyer_inquiries for update to authenticated
using ((((select auth.jwt()) -> 'app_metadata' ->> 'role')) = 'admin')
with check ((((select auth.jwt()) -> 'app_metadata' ->> 'role')) = 'admin');

create policy "SORCEE admins read inquiry activities"
on public.buyer_inquiry_activities for select to authenticated
using ((((select auth.jwt()) -> 'app_metadata' ->> 'role')) = 'admin');

create policy "SORCEE admins add inquiry activities"
on public.buyer_inquiry_activities for insert to authenticated
with check ((((select auth.jwt()) -> 'app_metadata' ->> 'role')) = 'admin'
  and (created_by is null or created_by = (select auth.uid())));

create index if not exists buyer_inquiries_assigned_to_idx
on public.buyer_inquiries (assigned_to);

create index if not exists buyer_inquiry_activities_created_by_idx
on public.buyer_inquiry_activities (created_by);
