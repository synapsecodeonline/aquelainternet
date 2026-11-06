create table if not exists snapshots (
  id uuid primary key default gen_random_uuid(),
  site_slug text not null,
  requested_date date not null,
  snapshot_timestamp text not null,
  snapshot_url text not null,
  status_code int,
  headline text,
  available boolean default false,
  created_at timestamptz default now(),
  unique (site_slug, requested_date)
);

alter table snapshots enable row level security;

create policy "public can read snapshots"
  on snapshots for select
  to anon
  using (true);

grant select on public.snapshots to anon;
