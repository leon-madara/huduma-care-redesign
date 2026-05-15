# 05 — Data Model

> The Postgres schema as it should look post-refactor. Sticks with Supabase
> managed Postgres + PostGIS. Tightens RLS. Cleans up half-baked tables from
> the template scaffolding.

## Core tables

```sql
-- Counties (static reference data; 47 rows for Kenya)
create table counties (
  code text primary key,                 -- e.g. '047' Nairobi
  name text not null,
  centroid geography(point, 4326) not null
);

-- Facilities — the heart of the system
create table facilities (
  id uuid primary key default gen_random_uuid(),
  kmhfr_code text unique,                -- canonical KMHFR identifier when known
  name text not null,
  slug text unique not null,
  type facility_type not null,           -- enum: hospital | clinic | lab | pharmacy | dental | maternity | mental_health
  ownership ownership_type not null,     -- enum: public | private | faith | ngo
  location geography(point, 4326),       -- PostGIS — enables ST_DWithin
  address text,
  county_code text references counties(code),
  ward text,
  phone text,
  whatsapp text,
  email text,
  website text,
  hours jsonb,                           -- { mon: [['08:00','17:00']], … emergency_24_7: bool }
  services text[] not null default '{}', -- normalized service tags
  insurances_accepted text[] not null default '{}',
  verified_at timestamptz,
  verified_source text,                  -- 'kmhfr' | 'callback' | 'admin' | 'community'
  freshness_score numeric(3,2),          -- 0..1, computed weekly by FacilityVerificationWorkflow
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index facilities_location_gix on facilities using gist (location);
create index facilities_services_gin on facilities using gin (services);
create index facilities_insurances_gin on facilities using gin (insurances_accepted);
create index facilities_county_idx on facilities (county_code);

-- Reviews
create table reviews (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references facilities(id) on delete cascade,
  user_id uuid references auth.users(id),         -- nullable for anonymous
  rating int not null check (rating between 1 and 5),
  aspect_ratings jsonb,                            -- { cleanliness:5, staff:4, wait:3, value:4 }
  insurance_accepted insurance_acceptance,         -- enum
  service text,                                    -- which service was reviewed
  text text,
  status review_status not null default 'pending', -- enum: pending|in_review|approved|rejected
  status_reason text,
  workflow_id text,                                -- Temporal workflow handle for traceability
  visited_on date,
  created_at timestamptz not null default now()
);

create index reviews_facility_idx on reviews (facility_id) where status = 'approved';
create index reviews_user_idx on reviews (user_id);

-- Booking requests (the workflow's source of truth on the DB side)
create table booking_requests (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references facilities(id),
  user_id uuid references auth.users(id),
  patient_name text not null,
  patient_phone text not null,
  service text not null,
  scheduled_for timestamptz not null,
  reason text,
  status booking_status not null default 'pending',
  -- enum: pending | confirmed | declined | no_response | cancelled | completed
  facility_response_at timestamptz,
  facility_response_via text,                    -- 'whatsapp' | 'sms' | 'dashboard'
  workflow_id text not null,
  created_at timestamptz not null default now()
);

-- Facility community corrections (suggestions from patients)
create table facility_corrections (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references facilities(id),
  field text not null,                             -- 'phone' | 'hours' | 'insurance' | ...
  suggested_value jsonb not null,
  submitted_by uuid references auth.users(id),
  status text not null default 'pending',          -- pending | accepted | rejected
  created_at timestamptz not null default now()
);

-- KMHFR sync runs
create table sync_runs (
  id uuid primary key default gen_random_uuid(),
  source text not null,                            -- 'kmhfr'
  workflow_id text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  facilities_created int default 0,
  facilities_updated int default 0,
  errors jsonb
);

-- Saved facilities (patient bookmarks)
create table saved_facilities (
  user_id uuid not null references auth.users(id) on delete cascade,
  facility_id uuid not null references facilities(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, facility_id)
);

-- Facility admins (membership table)
create table facility_admins (
  facility_id uuid not null references facilities(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'admin',              -- admin | viewer
  created_at timestamptz not null default now(),
  primary key (facility_id, user_id)
);
```

## Custom enums (clean and constrained)

```sql
create type facility_type as enum
  ('hospital', 'clinic', 'lab', 'pharmacy', 'dental', 'maternity', 'mental_health', 'eye', 'physiotherapy');

create type ownership_type as enum
  ('public', 'private', 'faith', 'ngo', 'community');

create type review_status as enum
  ('pending', 'in_review', 'approved', 'rejected');

create type booking_status as enum
  ('pending', 'confirmed', 'declined', 'no_response', 'cancelled', 'completed');

create type insurance_acceptance as enum
  ('yes_fully', 'yes_partially', 'no', 'na');
```

## RLS policies (essential)

```sql
alter table facilities enable row level security;
alter table reviews enable row level security;
alter table booking_requests enable row level security;
alter table saved_facilities enable row level security;
alter table facility_admins enable row level security;

-- Facilities: world-readable
create policy facilities_read_all on facilities for select using (true);

-- Facilities: only their admins can update (via api, which uses the user JWT)
create policy facilities_update_by_admin on facilities for update
  using (
    exists (
      select 1 from facility_admins fa
      where fa.facility_id = facilities.id and fa.user_id = auth.uid()
    )
  );

-- Reviews: approved are public; users see their own pending ones
create policy reviews_read_approved on reviews for select
  using (status = 'approved' or user_id = auth.uid());

create policy reviews_insert_own on reviews for insert
  with check (user_id = auth.uid() or user_id is null);

-- Booking requests: patient sees own; facility admins see their facility's
create policy bookings_read on booking_requests for select using (
  user_id = auth.uid()
  or exists (
    select 1 from facility_admins fa
    where fa.facility_id = booking_requests.facility_id and fa.user_id = auth.uid()
  )
);

-- Saved facilities: only owner
create policy saved_facilities_owner on saved_facilities
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
```

The **Temporal worker uses the service role key**, bypassing RLS. That's
fine because workflows enforce their own invariants in code; just make sure
the service key is only in worker pods.

## Hot-path query: nearby + service + insurance + open now

```sql
select
  f.id, f.name, f.type, f.address,
  ST_Distance(f.location, ST_MakePoint($lng, $lat)::geography) / 1000 as distance_km,
  f.hours, f.services, f.insurances_accepted, f.verified_at, f.freshness_score
from facilities f
where ST_DWithin(f.location, ST_MakePoint($lng, $lat)::geography, $radius_m)
  and ($service is null  or $service = any(f.services))
  and ($insurance is null or f.insurances_accepted && $insurance)
  and ($open_now = false or facility_open_now(f.hours, $now_eat))
order by distance_km asc
limit 30;
```

Wrap the open-now check in a Postgres function so the planner can use it:

```sql
create or replace function facility_open_now(hours jsonb, now_eat timestamptz)
returns boolean
language sql
immutable
as $$
  -- consult hours->day_of_week, returns true if any range covers time-of-day
  -- or hours->>'emergency_24_7' = 'true'
$$;
```

Cache results in Redis keyed by the canonical query tuple. TTL 5 minutes
for hot queries, invalidate via `invalidateSearchCache()` activity after
sync runs.

## What to delete from the current schema

Audit the existing tables. Drop:
- Anything from the original template (chat sessions, extracted documents, etc.) that doesn't apply.
- Free-text columns that should be normalized arrays (e.g. comma-separated `services`).
- Indexes on columns that aren't queried.

Run `select schemaname, tablename, n_live_tup from pg_stat_user_tables order by n_live_tup desc;` to see what's actually in use.
