create table properties (
  id uuid primary key default gen_random_uuid(),
  municipality_id uuid not null references municipalities(id) on delete cascade,
  owner_id uuid references owners(id) on delete set null,
  property_code text unique,
  title text not null,
  property_type text not null check (property_type in (
    'residential',
    'commercial',
    'mixed_use',
    'land',
    'industrial'
  )),
  usage_type text,
  address_line_1 text,
  address_line_2 text,
  city text,
  region text,
  postal_code text,
  country_code text default 'JO',
  plot_number text,
  parcel_number text,
  building_number text,
  floor_count integer,
  total_area_sqm numeric(12,2),
  geo_lat numeric(10,7),
  geo_lng numeric(10,7),
  registry_status text not null default 'active' check (registry_status in (
    'active',
    'inactive',
    'archived',
    'under_review'
  )),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_properties_municipality_id on properties(municipality_id);
create index idx_properties_owner_id on properties(owner_id);
