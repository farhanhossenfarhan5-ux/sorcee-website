alter table public.buyer_inquiries
  add column if not exists ip_hash text;

create index if not exists buyer_inquiries_ip_hash_created_idx
  on public.buyer_inquiries (ip_hash, created_at desc)
  where ip_hash is not null;
