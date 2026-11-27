# SORCEE Control Dashboard — Private CRM

A private admin workspace for SORCEE buyer inquiries, follow-ups, status changes, and internal notes.

## Live URL
https://sorcee.xyz/sorcee-control/

## Authentication and data security
- Supabase email/password authentication; there is no public sign-up form.
- The dashboard accepts only users whose server-managed `app_metadata.role` is `admin`.
- Buyer tables have Row Level Security policies limited to authenticated admins.
- Anonymous table access is revoked. The browser contains only the Supabase publishable key, never a service-role or secret key.
- The current SORCEE admin account `sorcee.official@gmail.com` has the server-managed admin role.
- Existing buyer tables currently contain no buyer records.

## CRM features
- View, search, and filter buyer inquiries.
- Add a buyer record with company, country, contact, product, quantity, target price, source, and message.
- Update lead status and next follow-up date.
- Append internal notes and status-change activity.
- Dashboard summary counts and recent buyer inquiries.

## Important limitations
- The public website quote form now submits to the CRM through the `sorcee-website-inquiry` Edge Function and also keeps the existing email notification path. The function validates inputs, enforces the 50-piece production minimum (sample-only requests are handled separately), applies per-IP and per-email rate limits, and stores only a one-way IP hash for rate limiting.
- No automated email, WhatsApp, or social publishing is enabled from this dashboard.
- The dashboard must not be treated as a customer-facing portal. It is for authorized SORCEE staff only.
- The 360-degree product viewer is not enabled because the repository currently has only one image per product category. A genuine 360 view needs a multi-angle image sequence or a 3D model per product; the current single images must not be presented as 360-degree product photography.

## Database security
The SQL migrations are stored in `supabase/migrations/`: initial admin-only access policies and grants, followed by an RLS lookup optimization and supporting foreign-key indexes.
