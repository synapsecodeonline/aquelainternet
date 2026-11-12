create schema if not exists aquelainternet;

create table if not exists aquelainternet.snapshots (
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

alter table aquelainternet.snapshots enable row level security;

drop policy if exists "public can read snapshots" on aquelainternet.snapshots;

create policy "public can read snapshots"
  on aquelainternet.snapshots for select
  to anon
  using (true);

grant usage on schema aquelainternet to anon, authenticated, service_role;
grant select on aquelainternet.snapshots to anon;
grant all on all tables in schema aquelainternet to service_role;
